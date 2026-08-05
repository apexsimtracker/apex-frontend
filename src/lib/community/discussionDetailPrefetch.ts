import type { QueryClient } from "@tanstack/react-query";
import type { Discussion } from "@/lib/api/community";
import { preloadDiscussionDetail } from "@/routes/routePreload";

export function discussionDetailQueryKey(id: string, userKey: string) {
  return ["discussion", "detail", id, userKey] as const;
}

type DiscussionDetailSeedInput = {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  description?: string;
  author: Discussion["author"];
  category: string;
  likeCount?: number;
  commentsCount?: number;
  commentCount?: number;
  replies?: number;
  views?: number;
  isPinned?: boolean;
  wasEdited?: boolean;
  editedAt?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
};

/** Seed detail cache from a community list card so the post can paint immediately. */
export function seedDiscussionDetailFromListItem(
  queryClient: QueryClient,
  input: DiscussionDetailSeedInput,
  userKey: string,
): void {
  const key = discussionDetailQueryKey(input.id, userKey);
  if (queryClient.getQueryData(key)) return;

  const replies =
    input.commentsCount ?? input.commentCount ?? input.replies ?? 0;
  const body =
    input.content ?? input.description ?? input.excerpt ?? "";

  const seeded: Discussion = {
    id: input.id,
    title: input.title,
    content: body,
    description: body,
    excerpt: input.excerpt,
    author: input.author,
    category: input.category,
    createdAt: input.createdAt ?? new Date(0).toISOString(),
    likeCount: input.likeCount ?? 0,
    likedByMe: false,
    commentCount: replies,
    commentsCount: replies,
    replies,
    views: input.views ?? 0,
    isPinned: input.isPinned,
    wasEdited: input.wasEdited,
    editedAt: input.editedAt ?? null,
    imageUrl: input.imageUrl ?? null,
  };
  queryClient.setQueryData(key, seeded);
}

export function warmDiscussionDetailNavigation(
  queryClient: QueryClient,
  input: DiscussionDetailSeedInput,
  userKey: string,
): void {
  void preloadDiscussionDetail();
  seedDiscussionDetailFromListItem(queryClient, input, userKey);
}
