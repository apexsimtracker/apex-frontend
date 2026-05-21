import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APEX_SESSION_TOKEN_KEY } from "@/auth/token";
import { APEX_DEVICE_ID_KEY } from "@/auth/deviceId";
import { buildApiAuthHeaders } from "./fetchClient";

describe("buildApiAuthHeaders", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns Bearer and X-Apex-Session when both tokens are stored", () => {
    storage.set("apex_token", "jwt-access");
    storage.set(APEX_SESSION_TOKEN_KEY, "opaque-session-id");

    expect(buildApiAuthHeaders()).toEqual({
      Authorization: "Bearer jwt-access",
      "X-Apex-Session": "opaque-session-id",
      "X-Apex-Device-Id": expect.any(String),
    });
  });

  it("omits Authorization when only session token is stored", () => {
    storage.set(APEX_SESSION_TOKEN_KEY, "opaque-only");

    const headers = buildApiAuthHeaders();
    expect(headers.Authorization).toBeUndefined();
    expect(headers["X-Apex-Session"]).toBe("opaque-only");
  });

  it("reuses existing device id from localStorage", () => {
    storage.set(APEX_DEVICE_ID_KEY, "device-abc");

    expect(buildApiAuthHeaders()["X-Apex-Device-Id"]).toBe("device-abc");
  });
});
