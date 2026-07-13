import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("discussionViewerId", () => {
  let local: Storage;
  let session: Storage;

  beforeEach(async () => {
    local = createMemoryStorage();
    session = createMemoryStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function loadModule() {
    return import("./discussionViewerId");
  }

  it("getOrCreateAnonymousViewerId returns stable value across calls", async () => {
    const mod = await loadModule();
    const first = mod.getOrCreateAnonymousViewerId();
    const second = mod.getOrCreateAnonymousViewerId();
    expect(second).toBe(first);
    expect(local.getItem(mod.ANON_VIEWER_STORAGE_KEY)).toBe(first);
  });

  it("falls back to sessionStorage when localStorage setItem throws", async () => {
    const mod = await loadModule();
    const sessionId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
    session.setItem(mod.ANON_VIEWER_STORAGE_KEY, sessionId);

    vi.spyOn(local, "setItem").mockImplementation(() => {
      throw new Error("localStorage blocked");
    });

    const id = mod.getOrCreateAnonymousViewerId();
    expect(id).toBe(sessionId);
  });

  it("uses in-memory singleton when both storages fail on read/write", async () => {
    const mod = await loadModule();
    vi.spyOn(local, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(session, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(local, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(session, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    const first = mod.getOrCreateAnonymousViewerId();
    const second = mod.getOrCreateAnonymousViewerId();
    expect(second).toBe(first);
  });

  it("markDiscussionViewedInBrowser and isDiscussionViewedInBrowser", async () => {
    const mod = await loadModule();
    expect(mod.isDiscussionViewedInBrowser("disc-1")).toBe(false);
    mod.markDiscussionViewedInBrowser("disc-1");
    expect(mod.isDiscussionViewedInBrowser("disc-1")).toBe(true);
    expect(mod.isDiscussionViewedInBrowser("disc-2")).toBe(false);
  });

  it("caps viewed-set at 500 and trims oldest entries", async () => {
    const mod = await loadModule();
    for (let i = 0; i < 501; i += 1) {
      mod.markDiscussionViewedInBrowser(`disc-${i}`);
    }

    const raw = local.getItem(mod.VIEWED_DISCUSSIONS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const ids = JSON.parse(raw!) as string[];
    expect(ids).toHaveLength(500);
    expect(ids[0]).toBe("disc-1");
    expect(ids[499]).toBe("disc-500");
    expect(mod.isDiscussionViewedInBrowser("disc-0")).toBe(false);
    expect(mod.isDiscussionViewedInBrowser("disc-500")).toBe(true);
  });
});
