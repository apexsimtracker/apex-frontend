import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CalendarClock,
  Wrench,
} from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { ApiError, fetchPublicMaintenanceWindow } from "@/lib/api";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";
import {
  formatDateTime,
  maintenanceBadgeBaseClassName,
  maintenanceStatusBadgeClass,
  prettyLabel,
  severityBadgeClass,
} from "@/pages/v2/maintenance/maintenanceNoticeUtils";

const PAGE_SHELL_CLASS =
  "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-6 px-6 py-8";

const sectionCardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-6 sm:p-7";

const statCellClassName =
  "rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-4";

const componentChipClassName =
  "inline-flex items-center rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container px-3 py-1.5 font-v2-body text-xs text-v2-on-surface-variant";

function maintenancePagePath(id: string): string {
  return `/v2/status/maintenance/${id}`;
}

export default function MaintenanceNoticeV2() {
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
    <>
      <PageMeta
        title={pageTitle}
        description={pageDescription}
        path={id ? maintenancePagePath(id) : "/v2/status/maintenance"}
      />
      <div className={PAGE_SHELL_CLASS}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className={cn(
              "inline-flex h-10 w-fit items-center gap-2 px-4 font-v2-body text-sm font-medium normal-case tracking-normal",
              v2OutlineButtonClassName,
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
          <Link
            to="/v2"
            className="inline-flex items-center gap-2 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          >
            <Wrench className="size-4" aria-hidden />
            System status
          </Link>
        </div>

        {maintenanceQuery.isPending ? (
          <div className="rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-8 text-center font-v2-body text-sm text-v2-on-surface-variant">
            Loading maintenance details…
          </div>
        ) : maintenanceQuery.isError ? (
          <div className="rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-8 text-center">
            <div
              className="mx-auto flex size-12 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-on-surface-variant"
              aria-hidden
            >
              <AlertTriangle className="size-5" />
            </div>
            <h1 className="mt-4 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
              {notFound
                ? "Maintenance notice not found"
                : "Could not load maintenance details"}
            </h1>
            <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
              {notFound
                ? "This maintenance page is not currently public or no longer available."
                : maintenanceQuery.error instanceof ApiError
                  ? maintenanceQuery.error.message
                  : "Please try again in a moment."}
            </p>
          </div>
        ) : maintenanceQuery.data ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container-low">
              <div className="h-1 bg-gradient-to-r from-v2-primary/90 via-v2-primary/35 to-transparent" />
              <div className="space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      maintenanceBadgeBaseClassName,
                      maintenanceStatusBadgeClass(maintenanceQuery.data.status),
                    )}
                  >
                    {prettyLabel(maintenanceQuery.data.status)}
                  </span>
                  {maintenanceQuery.data.linkedNotice ? (
                    <span
                      className={cn(
                        maintenanceBadgeBaseClassName,
                        "gap-1",
                        severityBadgeClass(
                          maintenanceQuery.data.linkedNotice.severity,
                        ),
                      )}
                    >
                      <BellRing className="size-3.5" aria-hidden />
                      {prettyLabel(maintenanceQuery.data.linkedNotice.severity)}
                    </span>
                  ) : null}
                </div>

                <div>
                  <p className="font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
                    Maintenance notice
                  </p>
                  <h1 className="mt-2 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
                    {maintenanceQuery.data.title}
                  </h1>
                  {maintenanceQuery.data.description ? (
                    <p className="mt-3 max-w-3xl font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                      {maintenanceQuery.data.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className={statCellClassName}>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant">
                      Starts
                    </p>
                    <p className="mt-2 font-v2-body text-sm font-medium text-v2-on-surface">
                      {formatDateTime(maintenanceQuery.data.startsAt)}
                    </p>
                  </div>
                  <div className={statCellClassName}>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant">
                      Ends
                    </p>
                    <p className="mt-2 font-v2-body text-sm font-medium text-v2-on-surface">
                      {formatDateTime(maintenanceQuery.data.endsAt)}
                    </p>
                  </div>
                  <div className={statCellClassName}>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant">
                      Owner
                    </p>
                    <p className="mt-2 font-v2-body text-sm font-medium text-v2-on-surface">
                      {maintenanceQuery.data.owner || "Apex operations"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {maintenanceQuery.data.linkedNotice ? (
              <section className={sectionCardClassName}>
                <div className="flex items-center gap-2 font-v2-headline text-sm font-semibold text-v2-on-surface">
                  <CalendarClock
                    className="size-4 text-v2-on-surface-variant"
                    aria-hidden
                  />
                  Linked notice
                </div>
                <h2 className="mt-3 font-v2-headline text-lg font-semibold text-v2-on-surface">
                  {maintenanceQuery.data.linkedNotice.title}
                </h2>
                <p className="mt-3 whitespace-pre-wrap font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                  {maintenanceQuery.data.linkedNotice.body}
                </p>
              </section>
            ) : null}

            <section className={sectionCardClassName}>
              <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
                Affected components
              </h2>
              {maintenanceQuery.data.affectedComponents.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {maintenanceQuery.data.affectedComponents.map((component) => (
                    <span key={component} className={componentChipClassName}>
                      {prettyLabel(component)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                  No specific components were listed for this maintenance
                  window.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}
