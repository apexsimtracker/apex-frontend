import { API_BASE } from "./config";
import { ApiError } from "./errors";
import { extractErrorInfo, notifyAuthExpired } from "./fetchClient";

export type DataExportFormat = "xlsx" | "pdf";

/**
 * GET /api/settings/data-export — downloads Excel (.xlsx) or summary PDF.
 * Lap telemetry is only included for Excel when `includeTelemetry` is true (large payloads).
 */
export async function downloadUserDataExport(options?: {
  format?: DataExportFormat;
  includeTelemetry?: boolean;
}): Promise<void> {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("apex_token") : null;
  const format = options?.format ?? "xlsx";
  const includeTelemetry = options?.includeTelemetry === true;
  const params = new URLSearchParams();
  params.set("format", format);
  if (includeTelemetry) params.set("includeTelemetry", "1");
  const qs = `?${params.toString()}`;
  const path = `/api/settings/data-export${qs}`;
  const url =
    path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(0, "Connection lost. Please try again.");
  }

  if (!res.ok) {
    const { message, code, retryAfterMs } = await extractErrorInfo(res);
    await notifyAuthExpired(false, res.status);
    throw new ApiError(res.status, message, code, retryAfterMs);
  }

  const blob = await res.blob();
  const defaultExt = format === "pdf" ? "pdf" : "xlsx";
  let filename = `apex-data-export-${new Date().toISOString().slice(0, 10)}.${defaultExt}`;
  const cd = res.headers.get("Content-Disposition");
  if (cd) {
    const star = /filename\*=UTF-8''([^;\s]+)/i.exec(cd);
    if (star?.[1]) {
      try {
        filename = decodeURIComponent(star[1]);
      } catch {
        /* keep default filename */
      }
    } else {
      const quoted = /filename="([^"]+)"/i.exec(cd);
      if (quoted?.[1]) filename = quoted[1];
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
