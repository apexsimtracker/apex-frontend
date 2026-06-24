import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadAgentBinary, getAgentDownloadLink } from "./agentDownload";
import { ProRequiredError } from "./errors";
import { emitProRequiredEvent } from "./fetchClient";

vi.mock("./config", () => ({
  getApiBase: () => "http://api.test",
  API_BASE: "http://api.test",
}));

vi.mock("./fetchClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./fetchClient")>();
  return {
    ...actual,
    buildApiAuthHeaders: vi.fn(() => ({
      Authorization: "Bearer test-jwt",
      "X-Apex-Session": "session-abc",
    })),
    emitProRequiredEvent: vi.fn(),
    notifyAuthExpired: vi.fn(),
  };
});

describe("agentDownload API", () => {
  const fetchMock = vi.fn();
  const createObjectURLMock = vi.fn(() => "blob:mock-url");
  const revokeObjectURLMock = vi.fn();
  const anchorClickMock = vi.fn();
  const appendChildMock = vi.fn((node: Node) => node);
  const locationState = {
    href: "http://localhost/agent",
    assign: vi.fn((url: string) => {
      locationState.href = url;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    locationState.href = "http://localhost/agent";

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });
    vi.stubGlobal("window", {
      location: locationState,
    });
    vi.stubGlobal("document", {
      createElement: (tagName: string) => {
        if (tagName === "a") {
          return {
            href: "",
            download: "",
            rel: "",
            click: anchorClickMock,
            remove: vi.fn(),
          };
        }
        return {};
      },
      body: {
        appendChild: appendChildMock,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to presigned URL when response is JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          url: "https://r2.example.com/signed?token=abc",
          expiresAt: "2026-05-23T12:00:00.000Z",
          filename: "ApexAgent-mac.dmg",
          os: "macos",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await downloadAgentBinary("macos");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/agent/download-link?os=macos",
      {
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt",
          "X-Apex-Session": "session-abc",
        }),
      }
    );
    expect(locationState.assign).toHaveBeenCalledWith(
      "https://r2.example.com/signed?token=abc"
    );
    expect(locationState.href).toBe("https://r2.example.com/signed?token=abc");
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it("downloads blob when response is octet-stream (local_file dev mode)", async () => {
    const body = new Uint8Array([0x4d, 0x5a]);
    fetchMock.mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="test.exe"',
        },
      })
    );

    const result = await getAgentDownloadLink("windows");

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(anchorClickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
    expect(result.filename).toBe("test.exe");
    expect(result.os).toBe("windows");
    expect(locationState.href).toBe("http://localhost/agent");
  });

  it("falls back to the linux AppImage filename when content-disposition is missing", async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([0x7f, 0x45, 0x4c, 0x46]), {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      })
    );

    const result = await getAgentDownloadLink("linux");

    expect(result.filename).toBe("ApexAgent-linux.AppImage");
    expect(result.os).toBe("linux");
    expect(anchorClickMock).toHaveBeenCalled();
  });

  it("throws ProRequiredError on 403 PRO_REQUIRED", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: "PRO_REQUIRED", message: "Pro required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(downloadAgentBinary("windows")).rejects.toBeInstanceOf(ProRequiredError);
    expect(emitProRequiredEvent).toHaveBeenCalled();
  });
});
