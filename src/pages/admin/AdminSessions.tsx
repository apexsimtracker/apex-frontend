import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteAdminSessions,
  fetchAdminSessionList,
  type AdminSessionListRow,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { BaseAlertDialog } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Trash2, Download } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  ADMIN_PAGE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_SCROLL,
  ADMIN_TD,
  ADMIN_TD_ACTIONS,
  ADMIN_TH,
  adminTable,
} from "@/pages/admin/adminTableLayout";
import { MANUAL_ACTIVITY_SIMS, type SimOption } from "@/lib/manualActivityData";
import SimBadge from "@/components/SimBadge";
import { formatCarName, formatLapMs, formatTrackName } from "@/lib/utils";

const TITLE = `Admin · Sessions & laps | ${COMPANY_NAME}`;
const SEARCH_DEBOUNCE_MS = 300;

const PRESET_SELECT_CLASS =
  "rounded-md border border-white/10 bg-card px-3 py-2 text-sm";

function downloadCsv(filename: string, rows: string[][]): void {
  const esc = (c: string) => {
    if (c.includes(",") || c.includes('"') || c.includes("\n")) {
      return `"${c.replace(/"/g, '""')}"`;
    }
    return c;
  };
  const body = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminSessions() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const debouncedQ = useDebouncedValue(qInput, SEARCH_DEBOUNCE_MS);
  const [userIdFilter, setUserIdFilter] = useState("");
  const debouncedUserId = useDebouncedValue(userIdFilter, SEARCH_DEBOUNCE_MS);
  const [simFilter, setSimFilter] = useState<string>("");
  const [challengeIdFilter, setChallengeIdFilter] = useState("");
  const debouncedChallengeId = useDebouncedValue(challengeIdFilter, SEARCH_DEBOUNCE_MS);
  const [fromIso, setFromIso] = useState("");
  const [toIso, setToIso] = useState("");
  const debouncedFromIso = useDebouncedValue(fromIso, SEARCH_DEBOUNCE_MS);
  const debouncedToIso = useDebouncedValue(toIso, SEARCH_DEBOUNCE_MS);
  const [maxLapMsInput, setMaxLapMsInput] = useState("");
  const debouncedMaxLap = useDebouncedValue(maxLapMsInput, SEARCH_DEBOUNCE_MS);

  const [zeroLaps, setZeroLaps] = useState(false);
  const [processingStuck, setProcessingStuck] = useState(false);
  const [hasInvalidLaps, setHasInvalidLaps] = useState(false);
  const [missingTelemetry, setMissingTelemetry] = useState(false);
  const [multipleBestLaps, setMultipleBestLaps] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState("");

  useEffect(() => {
    setPage(1);
  }, [
    debouncedQ,
    debouncedUserId,
    simFilter,
    debouncedChallengeId,
    debouncedFromIso,
    debouncedToIso,
    debouncedMaxLap,
    zeroLaps,
    processingStuck,
    hasInvalidLaps,
    missingTelemetry,
    multipleBestLaps,
  ]);

  const maxLapParsed = useMemo(() => {
    const t = debouncedMaxLap.trim();
    if (!t) return undefined;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [debouncedMaxLap]);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: 20,
      ...(debouncedQ.trim() ? { q: debouncedQ.trim() } : {}),
      ...(debouncedUserId.trim() ? { userId: debouncedUserId.trim() } : {}),
      ...(simFilter.trim() ? { sim: simFilter.trim() } : {}),
      ...(debouncedChallengeId.trim() ? { challengeId: debouncedChallengeId.trim() } : {}),
      ...(debouncedFromIso.trim() ? { from: debouncedFromIso.trim() } : {}),
      ...(debouncedToIso.trim() ? { to: debouncedToIso.trim() } : {}),
      ...(maxLapParsed != null ? { maxLapMs: maxLapParsed } : {}),
      ...(zeroLaps ? { zeroLaps: true } : {}),
      ...(processingStuck ? { processingStuck: true } : {}),
      ...(hasInvalidLaps ? { hasInvalidLaps: true } : {}),
      ...(missingTelemetry ? { missingTelemetry: true } : {}),
      ...(multipleBestLaps ? { multipleBestLaps: true } : {}),
    }),
    [
      page,
      debouncedQ,
      debouncedUserId,
      simFilter,
      debouncedChallengeId,
      debouncedFromIso,
      debouncedToIso,
      maxLapParsed,
      zeroLaps,
      processingStuck,
      hasInvalidLaps,
      missingTelemetry,
      multipleBestLaps,
    ]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin", "sessions", listParams],
    queryFn: () => fetchAdminSessionList(listParams),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAdminSessions(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sessions"] });
      setSelected(new Set());
      setBulkOpen(false);
      setBulkConfirm("");
    },
  });

  const rows: AdminSessionListRow[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  const rangeLabel = useMemo(() => {
    if (total === 0) return "No results";
    const pageSize = 20;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    const noun = total === 1 ? "session" : "sessions";
    return `Showing ${start}–${end} of ${total} ${noun}`;
  }, [total, currentPage]);

  /** True when every row on the current page is selected (not merely `selected.size === rows.length`). */
  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAllVisible(): void {
    const pageIds = rows.map((r) => r.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allInPage = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (allInPage) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  }

  function toggleOne(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCsv(): void {
    const header = [
      "id",
      "userId",
      "user",
      "sim",
      "track",
      "car",
      "laps",
      "bestLapMs",
      "invalidLaps",
      "challengeId",
      "createdAt",
    ];
    const lines: string[][] = [header];
    for (const r of rows) {
      lines.push([
        r.id,
        r.userId,
        r.userDisplayName,
        r.sim,
        r.track,
        r.car,
        String(r.lapCount),
        r.bestLapMs != null ? String(r.bestLapMs) : "",
        String(r.invalidLapCount),
        r.challengeId ?? "",
        r.createdAt,
      ]);
    }
    downloadCsv(`admin-sessions-page-${currentPage}.csv`, lines);
  }

  const hasActiveFilters =
    qInput.trim() ||
    userIdFilter.trim() ||
    simFilter ||
    challengeIdFilter.trim() ||
    fromIso.trim() ||
    toIso.trim() ||
    maxLapMsInput.trim() ||
    zeroLaps ||
    processingStuck ||
    hasInvalidLaps ||
    missingTelemetry ||
    multipleBestLaps;

  return (
    <>
      <PageMeta path="/admin/sessions" title={TITLE} description="Session review and moderation." noindex />
      <div className={ADMIN_PAGE}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sessions & laps</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Investigate uploads, fix laps, and manage sessions (with leaderboard &amp; personal-best
              reconciliation on the server).
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <Link to="/admin/tracks" className="text-primary underline-offset-4 hover:underline">
                Tracks &amp; catalogs
              </Link>{" "}
              — cross-check unknown track/car tokens.{" "}
              <Link
                to="/admin/leaderboards"
                className="text-primary underline-offset-4 hover:underline"
              >
                Global leaderboards
              </Link>{" "}
              for competitive context.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={rows.length === 0}
            >
              <Download className="mr-1.5 size-4" aria-hidden />
              Export CSV (this page)
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selected.size === 0}
              onClick={() => {
                setBulkConfirm("");
                setBulkOpen(true);
              }}
            >
              <Trash2 className="mr-1.5 size-4" aria-hidden />
              Delete selected ({selected.size})
            </Button>
          </div>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error instanceof ApiError ? error.message : "Could not load sessions."}
          </div>
        )}

        {!isError && (
          <div className={ADMIN_TABLE_CARD}>
            <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:px-4 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search track, car, driver name…"
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    className="w-full min-w-[12rem] max-w-xs"
                  />
                  <Input
                    placeholder="User ID…"
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                    className="w-full min-w-[10rem] max-w-[14rem] font-mono text-xs"
                  />
                  <Input
                    placeholder="Challenge ID…"
                    value={challengeIdFilter}
                    onChange={(e) => setChallengeIdFilter(e.target.value)}
                    className="w-full min-w-[10rem] max-w-[14rem] font-mono text-xs"
                  />
                  <select
                    className={PRESET_SELECT_CLASS}
                    value={simFilter}
                    onChange={(e) => {
                      setPage(1);
                      setSimFilter(e.target.value);
                    }}
                    aria-label="Sim"
                  >
                    <option value="">All sims</option>
                    {MANUAL_ACTIVITY_SIMS.map((s: SimOption) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="From (ISO datetime)"
                    value={fromIso}
                    onChange={(e) => setFromIso(e.target.value)}
                    className="min-w-[12rem] max-w-xs font-mono text-xs"
                  />
                  <Input
                    placeholder="To (ISO datetime)"
                    value={toIso}
                    onChange={(e) => setToIso(e.target.value)}
                    className="min-w-[12rem] max-w-xs font-mono text-xs"
                  />
                  <Input
                    placeholder="Suspicious: max lap ms (≤)"
                    value={maxLapMsInput}
                    onChange={(e) => setMaxLapMsInput(e.target.value)}
                    className="w-full min-w-[10rem] max-w-[12rem] font-mono text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={zeroLaps}
                      onChange={(e) => setZeroLaps(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Zero laps
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={processingStuck}
                      onChange={(e) => setProcessingStuck(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Processing stuck
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={hasInvalidLaps}
                      onChange={(e) => setHasInvalidLaps(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Has invalid laps
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={missingTelemetry}
                      onChange={(e) => setMissingTelemetry(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Missing lap telemetry
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={multipleBestLaps}
                      onChange={(e) => setMultipleBestLaps(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Multiple &quot;best&quot; flags
                  </label>
                </div>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground max-lg:w-full lg:text-right">
                {isPending ? "Loading…" : rangeLabel}
              </p>
            </div>

            {isPending ? (
              <div className="flex justify-center px-4 py-12" aria-busy="true">
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-medium text-foreground">No sessions match</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try clearing filters or search terms.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setQInput("");
                      setUserIdFilter("");
                      setChallengeIdFilter("");
                      setSimFilter("");
                      setFromIso("");
                      setToIso("");
                      setMaxLapMsInput("");
                      setZeroLaps(false);
                      setProcessingStuck(false);
                      setHasInvalidLaps(false);
                      setMissingTelemetry(false);
                      setMultipleBestLaps(false);
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className={ADMIN_TABLE_SCROLL}>
                <table className={adminTable("min-w-[48rem]")}>
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                      <th className="w-10 whitespace-nowrap p-3">
                        <input
                          type="checkbox"
                          aria-label="Select all on page"
                          checked={allOnPageSelected}
                          onChange={toggleAllVisible}
                          className="rounded border-white/20"
                        />
                      </th>
                      <th className={ADMIN_TH}>When</th>
                      <th className={ADMIN_TH}>User</th>
                      <th className={ADMIN_TH}>Sim</th>
                      <th className={ADMIN_TH}>Type</th>
                      <th className={ADMIN_TH}>Track / car</th>
                      <th className={ADMIN_TH}>Laps</th>
                      <th className={ADMIN_TH}>Best</th>
                      <th className={ADMIN_TH}>Challenge</th>
                      <th className="w-12 whitespace-nowrap p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="p-3 align-middle">
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleOne(r.id)}
                            aria-label={`Select session ${r.id}`}
                            className="rounded border-white/20"
                          />
                        </td>
                        <td className="p-3 align-middle text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 align-middle">
                          <Link
                            to={`/admin/users/${encodeURIComponent(r.userId)}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {r.userDisplayName}
                          </Link>
                          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                            {r.userId}
                          </div>
                        </td>
                        <td className="p-3 align-middle">
                          <SimBadge sim={r.sim} size="md" />
                        </td>
                        <td className="p-3 align-middle text-xs text-muted-foreground">
                          {r.sessionType ?? "—"}
                        </td>
                        <td className="p-3 align-middle">
                          <div className="font-medium">{formatTrackName(r.track)}</div>
                          <div className="text-muted-foreground">{formatCarName(r.car)}</div>
                          {r.invalidLapCount > 0 && (
                            <div className="mt-1 text-xs text-amber-400">
                              {r.invalidLapCount} invalid lap(s)
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-middle tabular-nums">{r.lapCount}</td>
                        <td className="p-3 align-middle tabular-nums text-muted-foreground min-w-[6rem]">
                          {formatLapMs(r.bestLapMs)}
                        </td>
                        <td className="p-3 align-middle text-xs">
                          {r.challengeId ? (
                            <>
                              <Link
                                to={`/admin/challenges/${encodeURIComponent(r.challengeId)}`}
                                className="text-primary hover:underline"
                              >
                                {r.challengeTitle ?? r.challengeId}
                              </Link>
                              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                {r.challengeId}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Actions">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/sessions/${r.id}`}>View / edit</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/sessions/${r.id}`} target="_blank" rel="noreferrer">
                                  Open public session
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!isPending && !isError && total > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
            <span className="self-center text-xs text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
          </div>
        )}
      </div>

      {bulkOpen && (
        <BaseAlertDialog
          isOpen={bulkOpen}
          onClose={() => {
            setBulkOpen(false);
            setBulkConfirm("");
          }}
          title="Delete sessions"
          description={
            <>
              Permanently delete {selected.size} session(s) and cascade laps. Leaderboards and
              personal bests will be recomputed server-side.
              <span className="mt-3 block text-xs">
                Type <span className="font-mono text-destructive">delete</span> to confirm.
              </span>
            </>
          }
          size="sm"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBulkOpen(false);
                  setBulkConfirm("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  bulkConfirm.trim().toLowerCase() !== "delete" || bulkDeleteMutation.isPending
                }
                onClick={() => bulkDeleteMutation.mutate([...selected])}
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </>
          }
        >
            <Input
              value={bulkConfirm}
              onChange={(e) => setBulkConfirm(e.target.value)}
              placeholder="delete"
              autoComplete="off"
            />
            {bulkDeleteMutation.isError && (
              <p className="mt-2 text-sm text-destructive">
                {bulkDeleteMutation.error instanceof ApiError
                  ? bulkDeleteMutation.error.message
                  : "Delete failed."}
              </p>
            )}
        </BaseAlertDialog>
      )}
    </>
  );
}
