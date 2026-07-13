import { apiGet, apiPost, apiDelete, apiPatch } from "./httpVerbs";

// Community discussions — category query params match backend: all | setup | guides | general
export const DISCUSSION_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "setup", label: "Setups" },
  { value: "guides", label: "Guides" },
  { value: "general", label: "General" },
] as const;

export type DiscussionCategory =
  (typeof DISCUSSION_CATEGORIES)[number]["value"];

/** Label for a discussion category key (setup → Setups). Unknown keys pass through. */
export function getDiscussionCategoryLabel(key: string): string {
  const k = String(key ?? "")
    .trim()
    .toLowerCase();
  const row = DISCUSSION_CATEGORIES.find((c) => c.value === k);
  return row?.label ?? key;
}

// Author object for community discussions/comments, returned directly by the backend.
// Shape: { id, displayName, avatarUrl }
export type DiscussionAuthor = {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type Discussion = {
  id: string;
  title: string;
  /** Post body from API (`content`); older code may use `description`. */
  content?: string;
  description?: string;
  excerpt?: string;
  author: DiscussionAuthor;
  category: string;
  createdAt: string;
  /** From GET /api/community/discussions (list + detail). */
  likeCount?: number;
  /** Present when the request is authenticated; whether the current user liked this post. */
  likedByMe?: boolean;
  commentCount?: number;
  /** Backend list/detail uses `commentsCount`. */
  commentsCount?: number;
  replies?: number;
  views?: number;
  isPinned?: boolean;
  editedAt?: string | null;
  wasEdited?: boolean;
  originalTitle?: string | null;
  originalBody?: string | null;
};

/** Default page size for GET /api/community/discussions (must match server default). */
export const DISCUSSIONS_PAGE_DEFAULT_LIMIT = 5;

export type DiscussionListSort =
  | "newest"
  | "oldest"
  | "mostLikes"
  | "mostViews"
  | "mostReplies";

export const DISCUSSION_LIST_SORT_OPTIONS: {
  value: DiscussionListSort;
  label: string;
}[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "mostLikes", label: "Most likes" },
  { value: "mostViews", label: "Most views" },
  { value: "mostReplies", label: "Most replies" },
];

export function getDiscussionListSortLabel(sort: DiscussionListSort): string {
  return (
    DISCUSSION_LIST_SORT_OPTIONS.find((o) => o.value === sort)?.label ??
    "Recent"
  );
}

/** Totals per category for community tiles (GET /api/community/discussions/counts). */
export type DiscussionCategoryCounts = {
  all: number;
  setup: number;
  guides: number;
  general: number;
};

export async function getDiscussionCategoryCounts(): Promise<DiscussionCategoryCounts> {
  return apiGet<DiscussionCategoryCounts>("/api/community/discussions/counts");
}

export type DiscussionsPageResult = {
  items: Discussion[];
  page: number;
  limit: number;
  hasMore: boolean;
  /** Total rows matching the current filter; omitted when includeTotal=false. */
  total?: number;
};

function normalizeDiscussionListItem(
  item: Record<string, unknown>,
): Discussion {
  const d = { ...item } as Discussion;
  const content = d.content ?? d.description;
  const withContent =
    typeof content === "string" && d.description == null
      ? { ...d, description: content }
      : d;
  const editedAt =
    typeof withContent.editedAt === "string" || withContent.editedAt === null
      ? withContent.editedAt
      : undefined;
  const wasEdited =
    typeof withContent.wasEdited === "boolean"
      ? withContent.wasEdited
      : Boolean(
          editedAt ?? withContent.originalTitle ?? withContent.originalBody,
        );
  return { ...withContent, wasEdited };
}

/**
 * Paginated community discussions (GET /api/community/discussions).
 */
export async function getDiscussionsPage(params?: {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: DiscussionListSort;
  /** Skip expensive total count on the server (list uses hasMore only). */
  includeTotal?: boolean;
}): Promise<DiscussionsPageResult> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.sort && params.sort !== "newest") sp.set("sort", params.sort);
  if (params?.includeTotal === false) sp.set("includeTotal", "0");
  const query = sp.toString();
  const path = `/api/community/discussions${query ? `?${query}` : ""}`;
  const raw = await apiGet<DiscussionsPageResult>(path);

  const items = (Array.isArray(raw.items) ? raw.items : []).map((x) =>
    normalizeDiscussionListItem(x as Record<string, unknown>),
  );
  return {
    items,
    page: typeof raw.page === "number" ? raw.page : 1,
    limit:
      typeof raw.limit === "number"
        ? raw.limit
        : DISCUSSIONS_PAGE_DEFAULT_LIMIT,
    hasMore: Boolean(raw.hasMore),
    total: typeof raw.total === "number" ? raw.total : undefined,
  };
}

export type CreateDiscussionBody = {
  category: string;
  title: string;
  description: string;
};

export async function createDiscussion(
  body: CreateDiscussionBody,
): Promise<Discussion> {
  return apiPost<Discussion>("/api/community/discussions", body);
}

export async function getDiscussion(id: string): Promise<Discussion> {
  const raw = await apiGet<Record<string, unknown>>(
    `/api/community/discussions/${id}`,
  );
  return normalizeDiscussionListItem(raw);
}

export type UpdateDiscussionBody = {
  title: string;
  description: string;
};

export async function updateDiscussion(
  id: string,
  body: UpdateDiscussionBody,
): Promise<Discussion> {
  const raw = await apiPatch<Record<string, unknown>>(
    `/api/community/discussions/${encodeURIComponent(id)}`,
    body,
  );
  return normalizeDiscussionListItem(raw);
}

export async function deleteDiscussion(id: string): Promise<void> {
  await apiDelete(`/api/community/discussions/${encodeURIComponent(id)}`);
}

export type DiscussionComment = {
  id: string;
  body: string;
  author: DiscussionAuthor;
  createdAt: string;
};

/** Default page size for discussion replies (must match server DISCUSSION_COMMENTS_DEFAULT_LIMIT). */
export const DISCUSSION_COMMENTS_PAGE_SIZE = 10;

export type DiscussionCommentsPageResult = {
  items: DiscussionComment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Normalize GET /discussions/:id/comments — paginated JSON from API. */
function normalizeDiscussionCommentsPage(
  raw: unknown,
  fallbackLimit: number,
): DiscussionCommentsPageResult {
  if (!raw || typeof raw !== "object") {
    return {
      items: [],
      page: 1,
      limit: fallbackLimit,
      total: 0,
      totalPages: 1,
    };
  }
  const o = raw as Record<string, unknown>;
  const items = Array.isArray(o.items) ? (o.items as DiscussionComment[]) : [];
  const limit =
    typeof o.limit === "number" && Number.isFinite(o.limit)
      ? o.limit
      : fallbackLimit;
  const page =
    typeof o.page === "number" && Number.isFinite(o.page) && o.page >= 1
      ? Math.floor(o.page)
      : 1;
  const total =
    typeof o.total === "number" && Number.isFinite(o.total)
      ? o.total
      : items.length;
  const totalPages =
    typeof o.totalPages === "number" &&
    Number.isFinite(o.totalPages) &&
    o.totalPages >= 1
      ? Math.floor(o.totalPages)
      : total === 0
        ? 1
        : Math.max(1, Math.ceil(total / limit));
  return { items, page, limit, total, totalPages };
}

export type DiscussionCommentsSort = "asc" | "desc";

export async function getDiscussionComments(
  id: string,
  params?: { page?: number; limit?: number; sort?: DiscussionCommentsSort },
): Promise<DiscussionCommentsPageResult> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.sort != null) sp.set("sort", params.sort);
  const q = sp.toString();
  const raw = await apiGet<unknown>(
    `/api/community/discussions/${encodeURIComponent(id)}/comments${q ? `?${q}` : ""}`,
  );
  return normalizeDiscussionCommentsPage(raw, DISCUSSION_COMMENTS_PAGE_SIZE);
}

export async function createDiscussionComment(
  id: string,
  body: string,
): Promise<DiscussionComment> {
  return apiPost<DiscussionComment>(
    `/api/community/discussions/${id}/comments`,
    { body: body.trim() },
  );
}

export type DiscussionLikeResponse = {
  likeCount: number;
  likedByMe: boolean;
};

export async function likeDiscussion(
  id: string,
): Promise<DiscussionLikeResponse> {
  return apiPost<DiscussionLikeResponse>(
    `/api/community/discussions/${id}/like`,
  );
}

export async function unlikeDiscussion(
  id: string,
): Promise<DiscussionLikeResponse> {
  return apiDelete<DiscussionLikeResponse>(
    `/api/community/discussions/${id}/like`,
  );
}

/** POST /api/community/discussions/:id/view — idempotent per viewer; send anonymousId whenever available (including when logged in for identity merge). */
export type DiscussionViewResponse = {
  views: number;
  recorded: boolean;
};

export async function recordDiscussionView(
  id: string,
  options?: { anonymousId?: string },
): Promise<DiscussionViewResponse> {
  const anon = options?.anonymousId?.trim();
  const path = `/api/community/discussions/${id}/view`;
  const credentialed = { credentials: "include" as const };
  if (anon) {
    return apiPost<DiscussionViewResponse>(
      path,
      { anonymousId: anon },
      credentialed,
    );
  }
  return apiPost<DiscussionViewResponse>(path, undefined, credentialed);
}
