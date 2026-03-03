import { fetchApi } from "@/lib/api";

export type MeResponse = {
  user: {
    id: string;
    email: string;
    displayName?: string;
    name?: string;
    createdAt?: string;
  };
};

export async function getMe(): Promise<MeResponse> {
  return fetchApi<MeResponse>("GET", "/api/auth/me", undefined, true);
}
