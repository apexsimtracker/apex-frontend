/** Persists one UUID per browser for anonymous view dedupe and server identity merge. */
export const ANON_VIEWER_STORAGE_KEY = "apex_discussion_anon_viewer";

/** Capped set of discussion ids already recorded in this browser (tier-0 short-circuit). */
export const VIEWED_DISCUSSIONS_STORAGE_KEY = "apex_discussion_viewed";

const MAX_VIEWED_DISCUSSIONS = 500;

let memoryAnonymousViewerId: string | null = null;

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Stable anonymous viewer id: localStorage → sessionStorage → in-memory singleton. */
export function getOrCreateAnonymousViewerId(): string {
  const fromLocal = readStorage(localStorage, ANON_VIEWER_STORAGE_KEY);
  if (fromLocal) return fromLocal;

  const fromSession = readStorage(sessionStorage, ANON_VIEWER_STORAGE_KEY);
  if (fromSession) {
    writeStorage(localStorage, ANON_VIEWER_STORAGE_KEY, fromSession);
    return fromSession;
  }

  if (!memoryAnonymousViewerId) {
    memoryAnonymousViewerId = crypto.randomUUID();
  }

  writeStorage(localStorage, ANON_VIEWER_STORAGE_KEY, memoryAnonymousViewerId);
  writeStorage(sessionStorage, ANON_VIEWER_STORAGE_KEY, memoryAnonymousViewerId);
  return memoryAnonymousViewerId;
}

function readViewedDiscussionIds(): string[] {
  const raw = readStorage(localStorage, VIEWED_DISCUSSIONS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeViewedDiscussionIds(ids: string[]): void {
  const trimmed =
    ids.length > MAX_VIEWED_DISCUSSIONS
      ? ids.slice(ids.length - MAX_VIEWED_DISCUSSIONS)
      : ids;
  writeStorage(localStorage, VIEWED_DISCUSSIONS_STORAGE_KEY, JSON.stringify(trimmed));
}

export function isDiscussionViewedInBrowser(discussionId: string): boolean {
  return readViewedDiscussionIds().includes(discussionId);
}

export function markDiscussionViewedInBrowser(discussionId: string): void {
  const ids = readViewedDiscussionIds();
  if (ids.includes(discussionId)) return;
  writeViewedDiscussionIds([...ids, discussionId]);
}
