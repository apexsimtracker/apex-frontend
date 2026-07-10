import type { MaintenanceWindowStatus, NotificationSeverity } from "@/lib/api";

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function prettyLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const maintenanceBadgeBaseClassName =
  "inline-flex w-fit items-center rounded-v2-sm px-2.5 py-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide";

export function maintenanceStatusBadgeClass(
  status: MaintenanceWindowStatus,
): string {
  switch (status) {
    case "ACTIVE":
      return "bg-v2-primary text-white";
    case "COMPLETED":
      return "border border-v2-success/30 bg-v2-success/10 text-v2-success";
    case "CANCELED":
      return "border border-v2-error/30 bg-v2-error/10 text-v2-error";
    case "SCHEDULED":
    default:
      return "border border-blue-500/30 bg-blue-500/15 text-blue-200";
  }
}

export function severityBadgeClass(severity: NotificationSeverity): string {
  switch (severity) {
    case "CRITICAL":
      return "border border-v2-error/30 bg-v2-error/10 text-v2-error";
    case "WARNING":
      return "border border-amber-500/30 bg-amber-500/15 text-amber-200";
    case "SUCCESS":
      return "border border-v2-success/30 bg-v2-success/10 text-v2-success";
    case "MAINTENANCE":
      return "border border-v2-outline-variant/20 bg-v2-surface-container-high text-v2-on-surface-variant";
    case "INFO":
    default:
      return "border border-blue-500/30 bg-blue-500/15 text-blue-200";
  }
}
