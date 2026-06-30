import type { APIRequestContext } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";

export type DiscussionCategory = "setup" | "guides" | "general";

export type DiscussionApi = {
  id: string;
  title: string;
  category: DiscussionCategory;
};

export type CreateDiscussionInput = {
  category: DiscussionCategory;
  title: string;
  description: string;
};

export async function createDiscussionViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  input: CreateDiscussionInput,
): Promise<DiscussionApi> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/community/discussions`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: input,
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`createDiscussion failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as {
    id?: string;
    title?: string;
    category?: string;
  };
  const id = data.id?.trim();
  if (!id) {
    throw new Error("createDiscussion response missing id");
  }

  return {
    id,
    title: data.title?.trim() || input.title,
    category: (data.category?.trim() || input.category) as DiscussionCategory,
  };
}

export async function deleteDiscussionViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  discussionId: string,
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.delete(
    `${apiUrl}/api/community/discussions/${encodeURIComponent(discussionId)}`,
    { headers: authHeaders(auth.token, auth.sessionToken) },
  );

  if (!res.ok() && res.status() !== 404) {
    const body = await res.text();
    throw new Error(`deleteDiscussion failed (${res.status()}): ${body}`);
  }
}
