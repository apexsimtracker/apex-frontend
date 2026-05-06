import { API_BASE } from "./config";
import { ApiError } from "./errors";
import { extractErrorInfo, fetchApi, notifyAuthExpired } from "./fetchClient";

export type AdminWaitlistRow = {
  userId: string;
  accountEmail: string;
  displayName: string;
  plan: "FREE" | "PRO";
  entitlementStatus: "ACTIVE" | "PAST_DUE" | "CANCELED" | null;
  isDeleted: boolean;
  suspendedAt: string | null;
  fullName: string;
  contactEmail: string;
  company: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminWaitlistListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  plan?: "FREE" | "PRO";
};

export async function fetchAdminWaitlistList(params?: AdminWaitlistListParams): Promise<{
  items: AdminWaitlistRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.plan) sp.set("plan", params.plan);
  const qs = sp.toString();
  return fetchApi("GET", `/api/admin/waitlist${qs ? `?${qs}` : ""}`, undefined, false);
}

/** Downloads CSV using current filters (same query string as list). */
export async function downloadAdminWaitlistExport(params?: Omit<AdminWaitlistListParams, "page" | "pageSize">): Promise<void> {
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.plan) sp.set("plan", params.plan);
  const qs = sp.toString();

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("apex_token") : null;
  const url = `${API_BASE}/api/admin/waitlist/export${qs ? `?${qs}` : ""}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(0, "Connection lost. Please try again.");
  }

  if (!res.ok) {
    await notifyAuthExpired(false, res.status);
    const { message } = await extractErrorInfo(res);
    throw new ApiError(res.status, message);
  }

  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  const filenameMatch = cd?.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? "pro-waitlist-export.csv";

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
