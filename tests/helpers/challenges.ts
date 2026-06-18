import type { APIRequestContext } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";

export type ChallengeDetailApi = {
  id?: string;
  title?: string;
  joined?: boolean;
  canLeave?: boolean;
  yourBestLapMs?: number | null;
  yourPosition?: number | null;
};

export type ChallengeLeaderboardRowApi = {
  rank: number;
  userId: string;
  username: string;
  bestLapMs: number;
  bestLapAt: string;
  attemptCount: number;
  verification: "UNVERIFIED" | "VERIFIED";
  bestSessionId: string | null;
};

export type ChallengeLeaderboardApi = {
  items: ChallengeLeaderboardRowApi[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function joinChallengeViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(
    `${apiUrl}/api/challenges/${encodeURIComponent(challengeId)}/join`,
    {
      headers: authHeaders(auth.token, auth.sessionToken),
      data: {},
    }
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`joinChallenge failed (${res.status()}): ${body}`);
  }
}

export async function leaveChallengeViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.delete(
    `${apiUrl}/api/challenges/${encodeURIComponent(challengeId)}/leave`,
    {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "X-Apex-Session": auth.sessionToken,
      },
    }
  );

  if (!res.ok() && res.status() !== 404) {
    const body = await res.text();
    throw new Error(`leaveChallenge failed (${res.status()}): ${body}`);
  }
}

export async function getChallengeDetailViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string
): Promise<ChallengeDetailApi> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(
    `${apiUrl}/api/challenges/${encodeURIComponent(challengeId)}`,
    { headers: authHeaders(auth.token, auth.sessionToken) }
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`getChallenge failed (${res.status()}): ${body}`);
  }

  return (await res.json()) as ChallengeDetailApi;
}

export async function getChallengeLeaderboardViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string,
  page = 1,
  pageSize = 50
): Promise<ChallengeLeaderboardApi> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(
    `${apiUrl}/api/challenges/${encodeURIComponent(challengeId)}/leaderboard?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders(auth.token, auth.sessionToken) }
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`getChallengeLeaderboard failed (${res.status()}): ${body}`);
  }

  return (await res.json()) as ChallengeLeaderboardApi;
}

export async function isChallengeParticipantViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  challengeId: string
): Promise<boolean> {
  const detail = await getChallengeDetailViaApi(request, auth, challengeId);
  return Boolean(detail.joined);
}

export function findLeaderboardRowForUser(
  leaderboard: ChallengeLeaderboardApi,
  userId: string
): ChallengeLeaderboardRowApi | undefined {
  return leaderboard.items.find((row) => row.userId === userId);
}
