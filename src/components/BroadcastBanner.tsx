import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Wrench,
  X,
} from "lucide-react";
import {
  dismissBroadcast,
  fetchActiveBroadcasts,
  pingBroadcastView,
  type ActiveBroadcast,
  type NotificationSeverity,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function isInternalAppPath(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("mailto:")) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  return trimmed.startsWith("/");
}

const VISIBLE_BANNERS = 3;
const VIEW_PING_DELAY_MS = 1500;

const SEVERITY_THEME: Record<
  NotificationSeverity,
  { container: string; chip: string; iconBg: string }
> = {
  INFO: {
    container: "border-sky-500/30 bg-sky-500/10",
    chip: "bg-sky-500/20 text-sky-200",
    iconBg: "bg-sky-500/20 text-sky-200",
  },
  SUCCESS: {
    container: "border-emerald-500/30 bg-emerald-500/10",
    chip: "bg-emerald-500/20 text-emerald-200",
    iconBg: "bg-emerald-500/20 text-emerald-200",
  },
  WARNING: {
    container: "border-amber-500/30 bg-amber-500/10",
    chip: "bg-amber-500/20 text-amber-200",
    iconBg: "bg-amber-500/20 text-amber-200",
  },
  CRITICAL: {
    container: "border-red-500/40 bg-red-500/10",
    chip: "bg-red-500/20 text-red-200",
    iconBg: "bg-red-500/25 text-red-200",
  },
  MAINTENANCE: {
    container: "border-violet-500/30 bg-violet-500/10",
    chip: "bg-violet-500/20 text-violet-200",
    iconBg: "bg-violet-500/20 text-violet-200",
  },
};

function SeverityIcon({ severity }: { severity: NotificationSeverity }) {
  const Icon =
    severity === "CRITICAL"
      ? AlertTriangle
      : severity === "WARNING"
        ? AlertTriangle
        : severity === "SUCCESS"
          ? CheckCircle2
          : severity === "MAINTENANCE"
            ? Wrench
            : Info;
  return <Icon className="size-4" aria-hidden />;
}

function ViewPing({ id }: { id: string }) {
  // Fire a one-time idempotent view ping shortly after the banner mounts.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    timer = setTimeout(() => {
      void pingBroadcastView(id).catch(() => {
        /* best-effort; idempotent on server */
      });
    }, VIEW_PING_DELAY_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);
  return null;
}

function BannerRow({
  broadcast,
  onDismiss,
}: {
  broadcast: ActiveBroadcast;
  onDismiss: (id: string) => void;
}) {
  const theme = SEVERITY_THEME[broadcast.severity];
  return (
    <div className={`border-b ${theme.container}`}>
      <div className="mx-auto flex max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <ViewPing id={broadcast.id} />
        <span
          className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full ${theme.iconBg}`}
          aria-hidden
        >
          <SeverityIcon severity={broadcast.severity} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{broadcast.title}</span>
            <span
              className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${theme.chip}`}
            >
              {broadcast.severity}
            </span>
          </div>
          <p className="text-sm text-foreground/80">{broadcast.body}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {broadcast.ctaLabel && broadcast.ctaUrl ? (
            isInternalAppPath(broadcast.ctaUrl) ? (
              <Link
                to={broadcast.ctaUrl}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-white/15"
              >
                {broadcast.ctaLabel}
              </Link>
            ) : (
              <a
                href={broadcast.ctaUrl}
                target={broadcast.ctaUrl.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-white/15"
              >
                {broadcast.ctaLabel}
              </a>
            )
          ) : null}
          {broadcast.dismissible && (
            <button
              type="button"
              onClick={() => onDismiss(broadcast.id)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BroadcastBanner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Hide the banner in the admin dashboard. Hooks below must still run so the
  // cache stays warm when the admin navigates back into the user-facing app.
  const onAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  const enabled = !!user;
  const { data } = useQuery({
    queryKey: ["broadcasts", "active"],
    queryFn: fetchActiveBroadcasts,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
    enabled,
  });

  const dismissMut = useMutation({
    mutationFn: (id: string) => dismissBroadcast(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["broadcasts", "active"] });
      const prev = qc.getQueryData<{ broadcasts: ActiveBroadcast[] }>(["broadcasts", "active"]);
      qc.setQueryData<{ broadcasts: ActiveBroadcast[] }>(["broadcasts", "active"], (cur) => ({
        broadcasts: (cur?.broadcasts ?? []).filter((b) => b.id !== id),
      }));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["broadcasts", "active"], ctx.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["broadcasts", "active"] });
    },
  });

  const broadcasts = data?.broadcasts ?? [];
  const visible = useMemo(
    () => (expanded ? broadcasts : broadcasts.slice(0, VISIBLE_BANNERS)),
    [broadcasts, expanded]
  );
  const overflow = broadcasts.length - VISIBLE_BANNERS;

  if (onAdminRoute) return null;
  if (!enabled || broadcasts.length === 0) return null;

  return (
    <div>
      {visible.map((b) => (
        <BannerRow
          key={b.id}
          broadcast={b}
          onDismiss={(id) => dismissMut.mutate(id)}
        />
      ))}
      {overflow > 0 && (
        <div className="border-b border-white/10 bg-card/40">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Bell className="size-3.5" aria-hidden />
              {expanded
                ? `Showing all ${broadcasts.length} announcements`
                : `+${overflow} more announcement${overflow === 1 ? "" : "s"}`}
            </span>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            >
              {expanded ? (
                <>
                  Collapse <ChevronUp className="size-3.5" />
                </>
              ) : (
                <>
                  Show all <ChevronDown className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
