import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, BellRing, CalendarClock, Wrench } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import {
  ApiError,
  fetchPublicMaintenanceWindow,
  type MaintenanceWindowStatus,
  type NotificationSeverity,
} from "@/lib/api";
import { COMPANY_NAME } from "@/lib/siteMeta";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: MaintenanceWindowStatus): string {
  switch (status) {
    case "ACTIVE":
      return "border-amber-500/35 bg-amber-500/12 text-amber-200";
    case "COMPLETED":
      return "border-emerald-500/35 bg-emerald-500/12 text-emerald-200";
    case "CANCELED":
      return "border-rose-500/35 bg-rose-500/12 text-rose-200";
    case "SCHEDULED":
    default:
      return "border-sky-500/35 bg-sky-500/12 text-sky-200";
  }
}

function severityTone(severity: NotificationSeverity): string {
  switch (severity) {
    case "CRITICAL":
      return "border-rose-500/35 bg-rose-500/12 text-rose-200";
    case "WARNING":
      return "border-amber-500/35 bg-amber-500/12 text-amber-200";
    case "SUCCESS":
      return "border-emerald-500/35 bg-emerald-500/12 text-emerald-200";
    case "MAINTENANCE":
      return "border-violet-500/35 bg-violet-500/12 text-violet-200";
    case "INFO":
    default:
      return "border-sky-500/35 bg-sky-500/12 text-sky-200";
  }
}

function prettyLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MaintenanceNotice() {
  const navigate = useNavigate();
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const id = maintenanceId?.trim() ?? "";

  const maintenanceQuery = useQuery({
    queryKey: ["public-maintenance-window", id],
    queryFn: () => fetchPublicMaintenanceWindow(id),
    enabled: id.length > 0,
    retry: false,
  });

  const pageTitle = useMemo(() => {
    if (maintenanceQuery.data?.title) {
      return `${maintenanceQuery.data.title} | Status | ${COMPANY_NAME}`;
    }
    return `Maintenance Status | ${COMPANY_NAME}`;
  }, [maintenanceQuery.data?.title]);

  const pageDescription =
    maintenanceQuery.data?.description ||
    maintenanceQuery.data?.linkedNotice?.body ||
    "Planned maintenance details and live status.";

  const notFound =
    maintenanceQuery.isError &&
    maintenanceQuery.error instanceof ApiError &&
    maintenanceQuery.error.status === 404;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={pageTitle}
        description={pageDescription}
        path={id ? `/status/maintenance/${id}` : "/status/maintenance"}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/6 bg-card/20 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-lg transition-colors hover:border-white/10 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Wrench className="size-4" />
            System status
          </Link>
        </div>

        {maintenanceQuery.isPending ? (
          <div className="rounded-xl border border-white/10 bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Loading maintenance details…
          </div>
        ) : maintenanceQuery.isError ? (
          <div className="rounded-xl border border-white/10 bg-card/40 p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground">
              <AlertTriangle className="size-5" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {notFound ? "Maintenance notice not found" : "Could not load maintenance details"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {notFound
                ? "This maintenance page is not currently public or no longer available."
                : maintenanceQuery.error instanceof ApiError
                  ? maintenanceQuery.error.message
                  : "Please try again in a moment."}
            </p>
          </div>
        ) : maintenanceQuery.data ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-card/40">
              <div className="h-1 bg-gradient-to-r from-[rgb(240,28,28)]/90 via-[rgb(240,28,28)]/35 to-transparent" />
              <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(maintenanceQuery.data.status)}`}
                  >
                    {prettyLabel(maintenanceQuery.data.status)}
                  </span>
                  {maintenanceQuery.data.linkedNotice ? (
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${severityTone(maintenanceQuery.data.linkedNotice.severity)}`}
                    >
                      <BellRing className="size-3.5" />
                      {prettyLabel(maintenanceQuery.data.linkedNotice.severity)}
                    </span>
                  ) : null}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Maintenance notice
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
                    {maintenanceQuery.data.title}
                  </h1>
                  {maintenanceQuery.data.description ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                      {maintenanceQuery.data.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Starts
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatDateTime(maintenanceQuery.data.startsAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ends
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatDateTime(maintenanceQuery.data.endsAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Owner
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {maintenanceQuery.data.owner || "Apex operations"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {maintenanceQuery.data.linkedNotice ? (
              <section className="rounded-2xl border border-white/10 bg-card/40 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  Linked notice
                </div>
                <h2 className="mt-3 text-xl font-semibold text-foreground">
                  {maintenanceQuery.data.linkedNotice.title}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground sm:text-base">
                  {maintenanceQuery.data.linkedNotice.body}
                </p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-white/10 bg-card/40 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">Affected components</h2>
              {maintenanceQuery.data.affectedComponents.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {maintenanceQuery.data.affectedComponents.map((component) => (
                    <span
                      key={component}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {prettyLabel(component)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No specific components were listed for this maintenance window.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
