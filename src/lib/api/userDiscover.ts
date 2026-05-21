import { apiGet } from "./httpVerbs";

/** Default page size for user discover (matches server USER_DISCOVER_DEFAULT_LIMIT). */
export const USER_DISCOVER_PAGE_SIZE = 10;

export const USER_DISCOVER_MIN_QUERY_LEN = 2;

export type UserDiscoverHit = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  followRelationship: "following" | "pending" | "none";
  privateProfile: boolean;
};

export type UserDiscoverPageResult = {
  items: UserDiscoverHit[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserDiscoverSearchParams = {
  q: string;
  page?: number;
  limit?: number;
};

/** GET /api/users/search — discover active users by name or email (auth required). */
export async function searchUsers(
  params: UserDiscoverSearchParams
): Promise<UserDiscoverPageResult> {
  const sp = new URLSearchParams();
  sp.set("q", params.q.trim());
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  return apiGet<UserDiscoverPageResult>(`/api/users/search?${sp.toString()}`);
}
