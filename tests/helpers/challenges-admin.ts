import type { APIRequestContext } from "@playwright/test";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";

const APEX_ROOT = resolve(import.meta.dirname, "../../../apex");

export type AdminChallengeLeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  bestLapMs: number;
  ban?: { reason: string | null; createdAt: string } | null;
};

export type AdminChallengeLeaderboardApi = {
  items: AdminChallengeLeaderboardRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminChallengeDetailApi = {
  id: string;
  title: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  startsAt: string;
  endsAt: string;
};

export async function patchChallengeViaAdminApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string,
  body: {
    startsAt?: string;
    endsAt?: string;
    title?: string;
  },
): Promise<AdminChallengeDetailApi> {
  const { apiUrl } = getE2eEnv();
  const res = await request.patch(
    `${apiUrl}/api/admin/challenges/${encodeURIComponent(challengeId)}`,
    {
      headers: authHeaders(auth.token, auth.sessionToken),
      data: body,
    },
  );
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`PATCH admin challenge failed (${res.status()}): ${text}`);
  }
  return (await res.json()) as AdminChallengeDetailApi;
}

export async function banChallengeParticipantViaAdminApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string,
  userId: string,
  reason: string,
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(
    `${apiUrl}/api/admin/challenges/${encodeURIComponent(challengeId)}/bans`,
    {
      headers: authHeaders(auth.token, auth.sessionToken),
      data: { userId, reason },
    },
  );
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`POST admin challenge ban failed (${res.status()}): ${text}`);
  }
}

export async function unbanChallengeParticipantViaAdminApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string,
  userId: string,
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.delete(
    `${apiUrl}/api/admin/challenges/${encodeURIComponent(challengeId)}/bans/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "X-Apex-Session": auth.sessionToken,
      },
    },
  );
  if (!res.ok() && res.status() !== 404) {
    const text = await res.text();
    throw new Error(
      `DELETE admin challenge ban failed (${res.status()}): ${text}`,
    );
  }
}

export async function getAdminChallengeLeaderboardViaAdminApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string,
  page = 1,
  pageSize = 50,
): Promise<AdminChallengeLeaderboardApi> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(
    `${apiUrl}/api/admin/challenges/${encodeURIComponent(challengeId)}/leaderboard?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders(auth.token, auth.sessionToken) },
  );
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(
      `GET admin challenge leaderboard failed (${res.status()}): ${text}`,
    );
  }
  return (await res.json()) as AdminChallengeLeaderboardApi;
}

/** Reset transition fixture when a prior run left it ENDED (admin PATCH locked). */
export function resetTransitionChallengeFixture(): void {
  execSync("npx tsx scripts/e2e/reset-transition-challenge.ts", {
    cwd: APEX_ROOT,
    env: process.env,
    stdio: "pipe",
  });
}
