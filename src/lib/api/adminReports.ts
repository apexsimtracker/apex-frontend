import { apiGet, apiPatch } from "./httpVerbs";
import type { ReportTargetType } from "./ugcModeration";

export type AdminReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";

export type AdminReportUser = {
  id: string;
  displayName: string;
  email: string;
};

export type AdminReportRow = {
  id: string;
  contentType: ReportTargetType;
  reason: string;
  details: string | null;
  status: AdminReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  targetContentId: string | null;
  parentContentId: string | null;
  preview: string | null;
  targetTitle: string | null;
  targetBody: string | null;
  available: boolean;
  targetIsReply: boolean | null;
  reporter: AdminReportUser;
  targetUser: AdminReportUser;
};

export type AdminReportListResult = {
  items: AdminReportRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function fetchAdminReports(params?: {
  page?: number;
  pageSize?: number;
  status?: AdminReportStatus | "ALL";
}): Promise<AdminReportListResult> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.status) sp.set("status", params.status);
  const q = sp.toString();
  return apiGet<AdminReportListResult>(`/api/admin/reports${q ? `?${q}` : ""}`);
}

export async function patchAdminReportStatus(
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
): Promise<{ id: string; status: AdminReportStatus; resolvedAt: string | null }> {
  return apiPatch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
    status,
  });
}
