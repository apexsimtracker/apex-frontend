import type { InfiniteData } from "@tanstack/react-query";
import type { ActivityFeedPageResult } from "@/lib/api";

function patchSessionInFeedItem(
  item: unknown,
  id: string,
  patch: Record<string, unknown>,
): unknown {
  if (!item || typeof item !== "object") return item;
  const rec = item as Record<string, unknown>;

  if (
    rec.type === "standalone" &&
    rec.session &&
    typeof rec.session === "object"
  ) {
    const session = rec.session as { id?: string };
    if (session.id === id) {
      return { ...rec, session: { ...rec.session, ...patch } };
    }
    return rec;
  }

  if (rec.type === "weekend" && rec.group && typeof rec.group === "object") {
    const group = rec.group as { sessions?: unknown[] };
    if (Array.isArray(group.sessions)) {
      return {
        ...rec,
        group: {
          ...group,
          sessions: group.sessions.map((s) => {
            const sess = s as { id?: string };
            return sess.id === id ? { ...sess, ...patch } : s;
          }),
        },
      };
    }
    return rec;
  }

  return item;
}

function mapSessionInFeedItem(
  item: unknown,
  id: string,
  mapper: (session: Record<string, unknown>) => Record<string, unknown>,
): unknown {
  if (!item || typeof item !== "object") return item;
  const rec = item as Record<string, unknown>;

  if (
    rec.type === "standalone" &&
    rec.session &&
    typeof rec.session === "object"
  ) {
    const session = rec.session as Record<string, unknown> & { id?: string };
    if (session.id === id) {
      return { ...rec, session: mapper(session) };
    }
    return rec;
  }

  if (rec.type === "weekend" && rec.group && typeof rec.group === "object") {
    const group = rec.group as { sessions?: unknown[] };
    if (Array.isArray(group.sessions)) {
      return {
        ...rec,
        group: {
          ...group,
          sessions: group.sessions.map((s) => {
            const sess = s as Record<string, unknown> & { id?: string };
            return sess.id === id ? mapper(sess) : s;
          }),
        },
      };
    }
    return rec;
  }

  return item;
}

/** Update one session in paginated activity feed cache (React Query infinite data). */
export function patchActivityFeedInfiniteData(
  old: InfiniteData<ActivityFeedPageResult> | undefined,
  id: string,
  patch: Record<string, unknown>,
): InfiniteData<ActivityFeedPageResult> | undefined {
  if (!old) return old;
  return {
    pageParams: old.pageParams,
    pages: old.pages.map((p) => ({
      ...p,
      items: p.items.map((x) => patchSessionInFeedItem(x, id, patch)),
    })),
  };
}

/** Increment comment counters on one session in paginated activity feed cache. */
export function bumpActivityFeedCommentCount(
  old: InfiniteData<ActivityFeedPageResult> | undefined,
  id: string,
  delta: number,
): InfiniteData<ActivityFeedPageResult> | undefined {
  if (!old) return old;
  return {
    pageParams: old.pageParams,
    pages: old.pages.map((p) => ({
      ...p,
      items: p.items.map((x) =>
        mapSessionInFeedItem(x, id, (session) => {
          const current = Number(
            session.commentCount ?? session.commentsCount ?? 0,
          );
          const next = Math.max(0, current + delta);
          return { ...session, commentCount: next, commentsCount: next };
        }),
      ),
    })),
  };
}

/** Extract flat session rows from grouped or legacy feed items (for stats, etc.). */
export function flattenFeedItemSessions(
  items: unknown[],
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (
      rec.type === "standalone" &&
      rec.session &&
      typeof rec.session === "object"
    ) {
      out.push(rec.session as Record<string, unknown>);
    } else if (
      rec.type === "weekend" &&
      rec.group &&
      typeof rec.group === "object"
    ) {
      const sessions = (rec.group as { sessions?: unknown[] }).sessions;
      if (Array.isArray(sessions)) {
        for (const s of sessions) {
          if (s && typeof s === "object")
            out.push(s as Record<string, unknown>);
        }
      }
    }
  }
  return out;
}
