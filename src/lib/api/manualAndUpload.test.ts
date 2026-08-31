import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import { uploadSessionFile } from "./manualAndUpload";

class MockUploadTarget extends EventTarget {
  onprogress: ((event: ProgressEvent) => void) | null = null;

  progress(loaded: number, total = 100) {
    this.onprogress?.({
      loaded,
      total,
      lengthComputable: true,
    } as ProgressEvent);
  }
}

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = [];

  readonly upload = new MockUploadTarget();
  readonly abort = vi.fn(() => {
    this.onabort?.();
  });
  status = 0;
  responseText = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor() {
    MockXMLHttpRequest.instances.push(this);
  }

  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
}

function telemetryFile(): File {
  const file = new Blob(["telemetry"]) as File;
  Object.defineProperty(file, "name", { value: "session.ibt" });
  return file;
}

function latestXhr(): MockXMLHttpRequest {
  const xhr =
    MockXMLHttpRequest.instances[MockXMLHttpRequest.instances.length - 1];
  if (!xhr) throw new Error("Expected an XMLHttpRequest instance");
  return xhr;
}

describe("uploadSessionFile", () => {
  beforeEach(() => {
    MockXMLHttpRequest.instances = [];
    vi.useFakeTimers();
    vi.stubGlobal(
      "XMLHttpRequest",
      MockXMLHttpRequest as unknown as typeof XMLHttpRequest,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts and reports a stalled upload after inactivity", async () => {
    const promise = uploadSessionFile(telemetryFile(), undefined, {
      inactivityTimeoutMs: 1_000,
    });
    const rejection = expect(promise).rejects.toMatchObject({
      code: "UPLOAD_STALLED",
      status: 0,
    } satisfies Partial<ApiError>);

    await vi.advanceTimersByTimeAsync(1_000);

    await rejection;
    expect(latestXhr().abort).toHaveBeenCalledOnce();
  });

  it("resets the inactivity timer only when transferred bytes increase", async () => {
    const promise = uploadSessionFile(telemetryFile(), undefined, {
      inactivityTimeoutMs: 1_000,
    });
    const xhr = latestXhr();
    const rejection = expect(promise).rejects.toMatchObject({
      code: "UPLOAD_STALLED",
    });

    await vi.advanceTimersByTimeAsync(800);
    xhr.upload.progress(10);
    await vi.advanceTimersByTimeAsync(800);
    xhr.upload.progress(10);
    await vi.advanceTimersByTimeAsync(200);

    await rejection;
    expect(xhr.abort).toHaveBeenCalledOnce();
  });

  it("stops the inactivity timer after the request body finishes", async () => {
    const promise = uploadSessionFile(telemetryFile(), undefined, {
      inactivityTimeoutMs: 1_000,
    });
    const xhr = latestXhr();

    xhr.upload.dispatchEvent(new Event("load"));
    await vi.advanceTimersByTimeAsync(2_000);
    expect(xhr.abort).not.toHaveBeenCalled();

    xhr.status = 200;
    xhr.responseText = JSON.stringify({ sessionId: "session-1" });
    xhr.onload?.();
    await expect(promise).resolves.toMatchObject({ sessionId: "session-1" });
  });

  it("aborts with a distinct error when the caller cancels", async () => {
    const controller = new AbortController();
    const promise = uploadSessionFile(telemetryFile(), undefined, {
      signal: controller.signal,
      inactivityTimeoutMs: 1_000,
    });
    const rejection = expect(promise).rejects.toMatchObject({
      code: "UPLOAD_CANCELED",
      status: 0,
    } satisfies Partial<ApiError>);

    controller.abort();

    await rejection;
    expect(latestXhr().abort).toHaveBeenCalledOnce();
  });

  it("reports network errors and settles only once", async () => {
    const promise = uploadSessionFile(telemetryFile(), undefined, {
      inactivityTimeoutMs: 1_000,
    });
    const xhr = latestXhr();

    xhr.onerror?.();
    xhr.onabort?.();

    await expect(promise).rejects.toMatchObject({
      message: "Connection lost. Please try again.",
      status: 0,
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
