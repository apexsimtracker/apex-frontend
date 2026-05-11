import { fetchApi } from "./fetchClient";

export type AdminCatalogKind = "track" | "car";

export type AdminCatalogTrackRow = {
  id: string;
  sim: string;
  slug: string;
  displayName: string;
  lengthKm: number | null;
  retiredAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCatalogCarRow = {
  id: string;
  sim: string;
  slug: string;
  displayName: string;
  retiredAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCatalogListParams = {
  page?: number;
  pageSize?: number;
  kind?: AdminCatalogKind;
  sim?: string;
  q?: string;
  includeRetired?: boolean;
};

export async function fetchAdminCatalogList(params?: AdminCatalogListParams): Promise<
  | {
      kind: "track";
      items: AdminCatalogTrackRow[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }
  | {
      kind: "car";
      items: AdminCatalogCarRow[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }
> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  sp.set("kind", params?.kind ?? "track");
  if (params?.sim?.trim()) sp.set("sim", params.sim.trim());
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.includeRetired) sp.set("includeRetired", "true");
  const qs = sp.toString();
  return fetchApi("GET", `/api/admin/catalog?${qs}`, undefined, false);
}

export async function createAdminCatalogTrack(body: {
  sim: string;
  slug: string;
  displayName: string;
  lengthKm: number;
  sortOrder?: number;
}): Promise<AdminCatalogTrackRow> {
  return fetchApi("POST", "/api/admin/catalog/tracks", body, false);
}

export async function patchAdminCatalogTrack(
  id: string,
  body: {
    displayName?: string;
    lengthKm?: number;
    sortOrder?: number;
    retired?: boolean;
  }
): Promise<AdminCatalogTrackRow> {
  return fetchApi("PATCH", `/api/admin/catalog/tracks/${encodeURIComponent(id)}`, body, false);
}

export async function createAdminCatalogCar(body: {
  sim: string;
  slug: string;
  displayName: string;
  sortOrder?: number;
}): Promise<AdminCatalogCarRow> {
  return fetchApi("POST", "/api/admin/catalog/cars", body, false);
}

export async function patchAdminCatalogCar(
  id: string,
  body: {
    displayName?: string;
    sortOrder?: number;
    retired?: boolean;
  }
): Promise<AdminCatalogCarRow> {
  return fetchApi("PATCH", `/api/admin/catalog/cars/${encodeURIComponent(id)}`, body, false);
}

export type AdminCatalogConsistency = {
  sessionTracks: { sim: string; token: string; count: number }[];
  sessionCars: { sim: string; token: string; count: number }[];
  challengeTracks: { sim: string; token: string; count: number }[];
  challengeCars: { sim: string; token: string; count: number }[];
  personalBestTracks: { token: string; count: number }[];
  personalBestCars: { token: string; count: number }[];
};

export async function fetchAdminCatalogConsistency(): Promise<AdminCatalogConsistency> {
  return fetchApi("GET", "/api/admin/catalog/consistency", undefined, false);
}
