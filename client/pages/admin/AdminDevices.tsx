import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAllAdminAuthSessionsForUser,
  deleteAdminDevice,
  fetchAdminAuthSessionUsersList,
  fetchAdminDevice,
  fetchAdminDeviceList,
  fetchAdminDevicesMetrics,
  patchAdminDevice,
  type AdminAuthSessionUserSummaryRow,
  type AdminDeviceRow,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toast } from "sonner";
import { AdminUserWebSessionsSection } from "./AdminUserWebSessionsSection";

const TITLE = `Admin · Devices & agent | ${COMPANY_NAME}`;
const SEARCH_DEBOUNCE_MS = 300;

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AdminDevices() {
  const qc = useQueryClient();
  const [mainTab, setMainTab] = useState<"devices" | "sessions">("devices");
  const prevMainTabRef = useRef(mainTab);

  const { data: metrics, isPending: metricsPending } = useQuery({
    queryKey: ["admin", "metrics", "devices"],
    queryFn: fetchAdminDevicesMetrics,
    staleTime: 0,
  });

  const [devicePage, setDevicePage] = useState(1);
  const [deviceSearchInput, setDeviceSearchInput] = useState("");
  const debouncedDeviceSearch = useDebouncedValue(deviceSearchInput, SEARCH_DEBOUNCE_MS);
  const [staleDays, setStaleDays] = useState<string>("");
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [sortDevices, setSortDevices] = useState<"lastSeenAt_desc" | "createdAt_desc">(
    "lastSeenAt_desc"
  );

  const [sessionPage, setSessionPage] = useState(1);
  const [sessionSearchInput, setSessionSearchInput] = useState("");
  const debouncedSessionSearch = useDebouncedValue(sessionSearchInput, SEARCH_DEBOUNCE_MS);
  const [sessionSuspiciousOnly, setSessionSuspiciousOnly] = useState(false);

  const deviceListParams = useMemo(
    () => ({
      page: devicePage,
      pageSize: 20,
      ...(debouncedDeviceSearch.trim() ? { q: debouncedDeviceSearch.trim() } : {}),
      ...(staleDays ? { staleDays: parseInt(staleDays, 10) } : {}),
      ...(includeRevoked ? { includeRevoked: true } : {}),
      sort: sortDevices,
    }),
    [devicePage, debouncedDeviceSearch, staleDays, includeRevoked, sortDevices]
  );

  const sessionListParams = useMemo(
    () => ({
      page: sessionPage,
      pageSize: 20,
      ...(debouncedSessionSearch.trim() ? { q: debouncedSessionSearch.trim() } : {}),
      ...(sessionSuspiciousOnly ? { suspiciousOnly: true as const } : {}),
    }),
    [sessionPage, debouncedSessionSearch, sessionSuspiciousOnly]
  );

  useEffect(() => {
    setDevicePage(1);
  }, [debouncedDeviceSearch, staleDays, includeRevoked, sortDevices]);

  useEffect(() => {
    setSessionPage(1);
  }, [debouncedSessionSearch, sessionSuspiciousOnly]);

  /** Fresh KPIs whenever this admin page is opened (cached metrics were misleading vs live lists). */
  useEffect(() => {
    void qc.invalidateQueries({ queryKey: ["admin", "metrics", "devices"] });
  }, [qc]);

  /** Web sign-ins list refetches when this tab is selected; keep the header cards aligned on tab switch. */
  useEffect(() => {
    const prev = prevMainTabRef.current;
    prevMainTabRef.current = mainTab;
    if (prev !== mainTab) {
      void qc.invalidateQueries({ queryKey: ["admin", "metrics", "devices"] });
    }
  }, [mainTab, qc]);

  const devicesQuery = useQuery({
    queryKey: ["admin", "devices", deviceListParams],
    queryFn: () => fetchAdminDeviceList(deviceListParams),
    enabled: mainTab === "devices",
  });

  const sessionsQuery = useQuery({
    queryKey: ["admin", "auth-sessions", "users", sessionListParams],
    queryFn: () => fetchAdminAuthSessionUsersList(sessionListParams),
    enabled: mainTab === "sessions",
  });

  const [sessionModalUserId, setSessionModalUserId] = useState<string | null>(null);

  const revokeDeviceMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await deleteAdminDevice(id, reason);
    },
    onSuccess: async () => {
      toast.success("Agent device revoked.");
      setRevokeDeviceOpen(false);
      setRevokeConfirm("");
      setRevokeDeviceReason("");
      await qc.invalidateQueries({ queryKey: ["admin", "devices"] });
      await qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : "Could not revoke device.");
    },
  });

  const revokeAllUserSessionsMutation = useMutation({
    mutationFn: async (userId: string) => {
      await deleteAllAdminAuthSessionsForUser(userId);
    },
    onSuccess: async (_, userId) => {
      toast.success("All web sessions revoked for this user.");
      setRevokeAllContext(null);
      setRevokeAllConfirm("");
      if (sessionModalUserId === userId) {
        setSessionModalUserId(null);
      }
      await qc.invalidateQueries({ queryKey: ["admin", "auth-sessions"] });
      await qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      await qc.invalidateQueries({ queryKey: ["admin", "auth-sessions", "user"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : "Could not revoke sessions.");
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await patchAdminDevice(id, { name });
    },
    onSuccess: async () => {
      toast.success("Device name updated.");
      setRenameOpen(false);
      await qc.invalidateQueries({ queryKey: ["admin", "devices"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : "Could not update name.");
    },
  });

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<AdminDeviceRow | null>(null);
  const [renameValue, setRenameValue] = useState("");

  /** Refetch single device when opening rename (GET /devices/:id; catches revoked/stale list). */
  useEffect(() => {
    if (!renameOpen || !renameTarget) return;
    let cancelled = false;
    void (async () => {
      try {
        const d = await fetchAdminDevice(renameTarget.id);
        if (cancelled) return;
        if (d.revokedAt) {
          toast.error("This device was revoked.");
          setRenameOpen(false);
          setRenameTarget(null);
          await qc.invalidateQueries({ queryKey: ["admin", "devices"] });
          await qc.invalidateQueries({ queryKey: ["admin", "metrics", "devices"] });
          return;
        }
        setRenameValue(d.name ?? "");
      } catch (e) {
        if (cancelled) return;
        toast.error(e instanceof ApiError ? e.message : "Could not load device.");
        setRenameOpen(false);
        setRenameTarget(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [renameOpen, renameTarget?.id, qc]);

  const [revokeDeviceOpen, setRevokeDeviceOpen] = useState(false);
  const [revokeDeviceTarget, setRevokeDeviceTarget] = useState<AdminDeviceRow | null>(null);
  const [revokeDeviceReason, setRevokeDeviceReason] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState("");

  /** Revoke every active web session for a user (sessions tab table). */
  const [revokeAllContext, setRevokeAllContext] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);
  const [revokeAllConfirm, setRevokeAllConfirm] = useState("");

  const deviceRows = devicesQuery.data?.items ?? [];
  const deviceTotal = devicesQuery.data?.total ?? 0;
  const deviceTotalPages = devicesQuery.data?.totalPages ?? 1;
  const sessionUserRows = sessionsQuery.data?.items ?? [];
  const sessionTotal = sessionsQuery.data?.total ?? 0;
  const sessionTotalActiveRows = sessionsQuery.data?.totalActiveRows;
  const sessionTotalPages = sessionsQuery.data?.totalPages ?? 1;

  const deviceRangeLabel = useMemo(() => {
    const pageSize = 20;
    const total = deviceTotal;
    const currentPage = devicePage;
    if (total === 0) return "No results";
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    const noun = total === 1 ? "device" : "devices";
    return `Showing ${start}–${end} of ${total} ${noun}`;
  }, [deviceTotal, devicePage]);

  const sessionRangeLabel = useMemo(() => {
    const pageSize = 20;
    const total = sessionTotal;
    const currentPage = sessionPage;
    if (total === 0) return "No results";
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    const noun = total === 1 ? "user" : "users";
    const rowHint =
      typeof sessionTotalActiveRows === "number"
        ? ` · ${sessionTotalActiveRows} active browser session${sessionTotalActiveRows === 1 ? "" : "s"} total`
        : "";
    return `Showing ${start}–${end} of ${total} ${noun} with active sessions${rowHint}`;
  }, [sessionTotal, sessionTotalActiveRows, sessionPage]);

  return (
    <>
      <PageMeta path="/admin/devices" title={TITLE} description="Manage agent devices and sign-ins." noindex />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Devices & agent</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Agent devices</strong> are desktop pairings
              (email code + Apex Agent). <strong className="font-medium text-foreground">Web sign-ins</strong>{" "}
              are server session rows for the site (not the same as racing sessions on{" "}
              <span className="whitespace-nowrap">/admin/sessions</span>).
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-card/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Agent devices
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {metricsPending ? "—" : formatInt(metrics?.devicesTotal ?? 0)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Active (not revoked)</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Web sessions (total)
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {metricsPending ? "—" : formatInt(metrics?.authSessionsTotal ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Web sessions (active)
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {metricsPending ? "—" : formatInt(metrics?.authSessionsActive ?? 0)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Non-expired, not revoked (usable browser sessions)
            </p>
          </div>
        </div>

        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "devices" | "sessions")} className="w-full">
          <TabsList className="h-auto rounded-lg border border-white/10 bg-white/5 p-0.5">
            <TabsTrigger
              value="devices"
              className="rounded-md px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-white/10 data-[state=active]:text-foreground"
            >
              Agent devices
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-md px-4 py-2 text-sm text-muted-foreground data-[state=active]:bg-white/10 data-[state=active]:text-foreground"
            >
              Web sign-ins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="mt-6">
            {devicesQuery.isError && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {devicesQuery.error instanceof ApiError
                  ? devicesQuery.error.message
                  : "Could not load devices."}
              </div>
            )}

            {!devicesQuery.isError && (
              <div className="rounded-xl border border-white/10">
                <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                  <div className="flex min-w-0 flex-wrap flex-1 items-center gap-3">
                    <Input
                      placeholder="Search user email or name…"
                      value={deviceSearchInput}
                      onChange={(e) => setDeviceSearchInput(e.target.value)}
                      className="w-full min-w-[12rem] max-w-xs"
                    />
                    <select
                      className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm"
                      value={staleDays}
                      onChange={(e) => {
                        setDevicePage(1);
                        setStaleDays(e.target.value);
                      }}
                      aria-label="Stale threshold"
                    >
                      <option value="">Any activity</option>
                      <option value="7">Stale 7+ days</option>
                      <option value="30">Stale 30+ days</option>
                      <option value="90">Stale 90+ days</option>
                    </select>
                    <select
                      className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm"
                      value={sortDevices}
                      onChange={(e) =>
                        setSortDevices(e.target.value as "lastSeenAt_desc" | "createdAt_desc")
                      }
                      aria-label="Sort"
                    >
                      <option value="lastSeenAt_desc">Sort: last seen</option>
                      <option value="createdAt_desc">Sort: created</option>
                    </select>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={includeRevoked}
                        onChange={(e) => setIncludeRevoked(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Include revoked
                    </label>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground max-lg:w-full lg:text-right">
                    {devicesQuery.isPending ? "Loading…" : deviceRangeLabel}
                  </p>
                </div>

                {devicesQuery.isPending ? (
                  <div className="flex justify-center px-4 py-12" aria-busy="true">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
                  </div>
                ) : deviceRows.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-sm font-medium text-foreground">No agent devices</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Rows appear when a user pairs the Apex Agent (device token) with their account. Browsing
                      the website alone does not create an agent device.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try clearing filters if you expected a paired machine.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-muted-foreground">
                          <th className="p-3">Device</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Last seen</th>
                          <th className="p-3">Created</th>
                          <th className="p-3">Status</th>
                          <th className="w-12 p-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {deviceRows.map((r) => (
                          <tr key={r.id} className="border-b border-white/5">
                            <td className="p-3 font-medium">{r.name ?? "—"}</td>
                            <td className="p-3">
                              <Link
                                className="text-primary underline-offset-4 hover:underline"
                                to={`/admin/users/${r.user.id}`}
                              >
                                {r.user.displayName}
                              </Link>
                              <div className="text-xs text-muted-foreground">{r.user.email}</div>
                            </td>
                            <td className="p-3 text-muted-foreground tabular-nums">
                              {formatTs(r.lastSeenAt)}
                            </td>
                            <td className="p-3 text-muted-foreground tabular-nums">
                              {formatTs(r.createdAt)}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {r.revokedAt ? "Revoked" : "Active"}
                            </td>
                            <td className="p-3 text-right">
                              {!r.revokedAt ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Actions">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setRenameTarget(r);
                                        setRenameValue(r.name ?? "");
                                        setRenameOpen(true);
                                      }}
                                    >
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setRevokeDeviceTarget(r);
                                        setRevokeDeviceReason("");
                                        setRevokeConfirm("");
                                        setRevokeDeviceOpen(true);
                                      }}
                                    >
                                      Revoke device
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {!devicesQuery.isPending && !devicesQuery.isError && deviceTotal > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={devicePage <= 1}
                  onClick={() => setDevicePage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={devicePage >= deviceTotalPages}
                  onClick={() => setDevicePage((p) => Math.min(deviceTotalPages, p + 1))}
                >
                  Next
                </Button>
                <span className="self-center text-xs text-muted-foreground">
                  Page {devicePage} / {deviceTotalPages}
                </span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            {sessionsQuery.isError && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {sessionsQuery.error instanceof ApiError
                  ? sessionsQuery.error.message
                  : "Could not load sessions."}
              </div>
            )}

            {!sessionsQuery.isError && (
              <div className="rounded-xl border border-white/10">
                <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                  <div className="flex min-w-0 flex-wrap flex-1 items-center gap-3">
                    <Input
                      placeholder="Search user email or name…"
                      value={sessionSearchInput}
                      onChange={(e) => setSessionSearchInput(e.target.value)}
                      className="w-full min-w-[12rem] max-w-xs"
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={sessionSuspiciousOnly}
                        onChange={(e) => setSessionSuspiciousOnly(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Suspicious only (risk ≥ 50)
                    </label>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground max-lg:w-full lg:text-right">
                    {sessionsQuery.isPending ? "Loading…" : sessionRangeLabel}
                  </p>
                </div>

                {sessionsQuery.isPending ? (
                  <div className="flex justify-center px-4 py-12" aria-busy="true">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
                  </div>
                ) : sessionUserRows.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-sm font-medium text-foreground">No active web sessions listed</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This tab lists server sessions created when someone signs in (non-expired only). Each
                      browser needs a fresh sign-in after this feature rolls out so it stores the server
                      session id with the JWT; otherwise only JWT auth runs and this list can stay empty.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Expired sessions are never shown. Try another search.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-muted-foreground">
                          <th className="p-3">User</th>
                          <th className="p-3">Last active</th>
                          <th className="p-3">Expires (soonest)</th>
                          <th className="p-3 text-right tabular-nums">Devices</th>
                          <th className="p-3 text-right tabular-nums">Active</th>
                          <th className="p-3 text-right tabular-nums">Max risk</th>
                          <th className="p-3 text-right tabular-nums">Flagged</th>
                          <th className="w-12 p-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {sessionUserRows.map((row) => (
                          <tr key={row.user.id} className="border-b border-white/5">
                            <td className="p-3">
                              <Link
                                className="font-medium text-primary underline-offset-4 hover:underline"
                                to={`/admin/users/${row.user.id}`}
                              >
                                {row.user.displayName}
                              </Link>
                              <div className="text-xs text-muted-foreground">{row.user.email}</div>
                            </td>
                            <td className="p-3 text-muted-foreground tabular-nums">
                              {formatTs(row.lastActiveAt)}
                            </td>
                            <td className="p-3 text-muted-foreground tabular-nums">
                              {formatTs(row.soonestExpiresAt)}
                            </td>
                            <td className="p-3 text-right tabular-nums text-muted-foreground">
                              {row.distinctDeviceCount ?? "—"}
                            </td>
                            <td className="p-3 text-right tabular-nums text-muted-foreground">
                              {row.activeSessionCount}
                            </td>
                            <td className="p-3 text-right tabular-nums">
                              <span
                                className={
                                  (row.maxRiskScore ?? 0) >= 50
                                    ? "font-medium text-amber-400"
                                    : "text-muted-foreground"
                                }
                              >
                                {row.maxRiskScore ?? 0}
                              </span>
                            </td>
                            <td className="p-3 text-right tabular-nums text-muted-foreground">
                              {row.suspiciousSessionCount ?? 0}
                            </td>
                            <td className="p-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Actions">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSessionModalUserId(row.user.id);
                                    }}
                                  >
                                    View sessions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setRevokeAllContext({
                                        userId: row.user.id,
                                        displayName: row.user.displayName,
                                      });
                                      setRevokeAllConfirm("");
                                    }}
                                  >
                                    Revoke all sessions
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

            {!sessionsQuery.isPending && !sessionsQuery.isError && sessionTotal > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sessionPage <= 1}
                  onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sessionPage >= sessionTotalPages}
                  onClick={() => setSessionPage((p) => Math.min(sessionTotalPages, p + 1))}
                >
                  Next
                </Button>
                <span className="self-center text-xs text-muted-foreground">
                  Page {sessionPage} / {sessionTotalPages}
                </span>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {sessionModalUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-[min(100vw-2rem,42rem)] overflow-y-auto rounded-xl border border-white/10 bg-card p-6 shadow-xl xl:max-w-6xl">
              <AdminUserWebSessionsSection
                variant="modal"
                userId={sessionModalUserId}
                onCloseModal={() => setSessionModalUserId(null)}
              />
            </div>
          </div>
        )}

        {revokeAllContext && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-foreground">Revoke all web sessions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Invalidates every usable browser session for{" "}
                <span className="font-medium text-foreground">{revokeAllContext.displayName}</span>.
                API access stops immediately; session rows are kept for analysis unless deleted. Type{" "}
                <span className="font-mono text-foreground">revoke all</span> to confirm.
              </p>
              <Input
                className="mt-4"
                value={revokeAllConfirm}
                onChange={(e) => setRevokeAllConfirm(e.target.value)}
                placeholder="revoke all"
                autoComplete="off"
              />
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRevokeAllContext(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={
                    revokeAllConfirm !== "revoke all" || revokeAllUserSessionsMutation.isPending
                  }
                  onClick={() => revokeAllUserSessionsMutation.mutate(revokeAllContext.userId)}
                >
                  {revokeAllUserSessionsMutation.isPending ? "Revoking…" : "Revoke all"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {renameOpen && renameTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-foreground">Rename device</h2>
              <Input
                className="mt-4"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Device label"
                autoComplete="off"
              />
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={renameMutation.isPending}
                  onClick={() =>
                    renameMutation.mutate({ id: renameTarget.id, name: renameValue })
                  }
                >
                  {renameMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {revokeDeviceOpen && revokeDeviceTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-foreground">Revoke agent device</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The agent will no longer be able to upload using this pairing. Type{" "}
                <span className="font-mono text-foreground">revoke</span> to confirm.
              </p>
              <Input
                className="mt-4"
                value={revokeDeviceReason}
                onChange={(e) => setRevokeDeviceReason(e.target.value)}
                placeholder="Reason (optional)"
                autoComplete="off"
              />
              <Input
                className="mt-3"
                value={revokeConfirm}
                onChange={(e) => setRevokeConfirm(e.target.value)}
                placeholder="revoke"
                autoComplete="off"
              />
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRevokeDeviceOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={revokeConfirm !== "revoke" || revokeDeviceMutation.isPending}
                  onClick={() =>
                    revokeDeviceMutation.mutate({
                      id: revokeDeviceTarget.id,
                      reason: revokeDeviceReason.trim() || undefined,
                    })
                  }
                >
                  {revokeDeviceMutation.isPending ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function formatInt(n: number): string {
  return new Intl.NumberFormat().format(n);
}
