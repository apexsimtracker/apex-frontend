import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { APIRequestContext } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";

const APEX_ROOT = resolve(import.meta.dirname, "../../../apex");

export type MeProfile = {
  id?: string;
  email?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type PrivacySettings = {
  privateProfile: boolean;
  manualFollowApproval: boolean;
  sessionVisibility: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
};

export type WeeklyGoalsPayload = {
  races: { current: number; target: number };
  podiums: { current: number; target: number };
  laps: { current: number; target: number };
};

export const DEFAULT_WEEKLY_GOALS = {
  weeklyRacesTarget: 10,
  weeklyPodiumsTarget: 5,
  weeklyLapsTarget: 100,
} as const;

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET?.trim()
  );
}

export async function getMeViaApi(
  request: APIRequestContext,
  auth: AuthSession
): Promise<MeProfile> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(`${apiUrl}/api/auth/me`, {
    headers: authHeaders(auth.token, auth.sessionToken),
  });
  if (!res.ok()) {
    throw new Error(`GET /api/auth/me failed (${res.status()})`);
  }
  return (await res.json()) as MeProfile;
}

export async function patchMeViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  body: { displayName?: string; bio?: string | null; avatarUrl?: string | null }
): Promise<MeProfile> {
  const { apiUrl } = getE2eEnv();
  const res = await request.patch(`${apiUrl}/api/auth/me`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: body,
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`PATCH /api/auth/me failed (${res.status()}): ${text}`);
  }
  return (await res.json()) as MeProfile;
}

export async function patchPrivacyViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  body: Partial<PrivacySettings>
): Promise<PrivacySettings> {
  const { apiUrl } = getE2eEnv();
  const res = await request.patch(`${apiUrl}/api/settings/privacy`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: body,
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`PATCH /api/settings/privacy failed (${res.status()}): ${text}`);
  }
  return (await res.json()) as PrivacySettings;
}

export async function patchWeeklyGoalsViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  body: {
    weeklyRacesTarget?: number;
    weeklyPodiumsTarget?: number;
    weeklyLapsTarget?: number;
  }
): Promise<{ ok?: boolean; weeklyGoals: WeeklyGoalsPayload }> {
  const { apiUrl } = getE2eEnv();
  const res = await request.patch(`${apiUrl}/api/profile/weekly-goals`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: body,
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`PATCH /api/profile/weekly-goals failed (${res.status()}): ${text}`);
  }
  return (await res.json()) as { ok?: boolean; weeklyGoals: WeeklyGoalsPayload };
}

export async function changePasswordViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/settings/change-password`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: { currentPassword, newPassword },
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`POST /api/settings/change-password failed (${res.status()}): ${text}`);
  }
}

export async function unfollowUserViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  userId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.delete(`${apiUrl}/api/users/${encodeURIComponent(userId)}/follow`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "X-Apex-Session": auth.sessionToken,
    },
  });
  if (!res.ok() && res.status() !== 404) {
    const text = await res.text();
    throw new Error(`DELETE follow failed (${res.status()}): ${text}`);
  }
}

export async function getFollowStatusViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  userId: string
): Promise<{ isFollowing: boolean }> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(
    `${apiUrl}/api/users/${encodeURIComponent(userId)}/follow-status`,
    { headers: authHeaders(auth.token, auth.sessionToken) }
  );
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`GET follow-status failed (${res.status()}): ${text}`);
  }
  return (await res.json()) as { isFollowing: boolean };
}

export async function deleteSessionViaAdminApi(
  request: APIRequestContext,
  adminAuth: AuthSession,
  sessionId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.delete(
    `${apiUrl}/api/admin/sessions/${encodeURIComponent(sessionId)}`,
    { headers: authHeaders(adminAuth.token, adminAuth.sessionToken) }
  );
  if (!res.ok() && res.status() !== 404) {
    const text = await res.text();
    throw new Error(`Admin session delete failed (${res.status()}): ${text}`);
  }
}

export async function uploadAvatarViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  filePath: string
): Promise<{ avatarUrl: string }> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/profile/avatar`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "X-Apex-Session": auth.sessionToken,
    },
    multipart: {
      avatar: {
        name: "avatar-e2e.png",
        mimeType: "image/png",
        buffer: readFileSync(filePath),
      },
    },
  });
  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`POST /api/profile/avatar failed (${res.status()}): ${text}`);
  }
  return (await res.json()) as { avatarUrl: string };
}

export function reseedE2eUsers(): void {
  const env = getE2eEnv();
  execSync("npm run seed:e2e", {
    cwd: APEX_ROOT,
    env: {
      ...process.env,
      E2E_SEED_PASSWORD: env.password,
      E2E_USER_PASSWORD: env.password,
    },
    stdio: "pipe",
  });
}
