import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminDevice,
  fetchAdminDevice,
  fetchAdminDeviceList,
  fetchAdminDevicesMetrics,
  patchAdminDevice,
  type AdminDeviceRow,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import {
  BaseAlertDialog,
  BaseModal,
} from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toast } from "sonner";

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

function formatInt(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export default function AdminDevices() {
  const qc = useQueryClient();

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

  useEffect(() => {
    setDevicePage(1);
  }, [debouncedDeviceSearch, staleDays, includeRevoked, sortDevices]);

  useEffect(() => {
    void qc.invalidateQueries({ queryKey: ["admin", "metrics", "devices"] });
  }, [qc]);

  const devicesQuery = useQuery({
    queryKey: ["admin", "devices", deviceListParams],
    queryFn: () => fetchAdminDeviceList(deviceListParams),
  });

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

  const deviceRows = devicesQuery.data?.items ?? [];
  const deviceTotal = devicesQuery.data?.total ?? 0;
  const deviceTotalPages = devicesQuery.data?.totalPages ?? 1;

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

  return (
    <>
      <PageMeta
        path="/admin/devices"
        title={TITLE}
        description="Manage Apex Agent desktop pairings."
        noindex
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Devices & agent</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Agent devices</strong> are desktop pairings
              (email code + Apex Agent). Browser sign-ins are managed under{" "}
              <Link className="text-primary underline-offset-4 hover:underline" to="/admin/email-auth?tab=auth">
                Email &amp; auth ops
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="rounded-xl border border-white/10 bg-card/30 px-4 py-3 sm:max-w-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agent devices</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {metricsPending ? "—" : formatInt(metrics?.devicesTotal ?? 0)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Active (not revoked)</p>
          </div>
        </div>

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
                  Rows appear when a user pairs the Apex Agent (device token) with their account. Browsing the
                  website alone does not create an agent device.
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
                        <td className="p-3 text-muted-foreground tabular-nums">{formatTs(r.lastSeenAt)}</td>
                        <td className="p-3 text-muted-foreground tabular-nums">{formatTs(r.createdAt)}</td>
                        <td className="p-3 text-muted-foreground">{r.revokedAt ? "Revoked" : "Active"}</td>
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

        {renameOpen && renameTarget && (
          <BaseModal
            isOpen={renameOpen}
            onClose={() => setRenameOpen(false)}
            title="Rename device"
            size="sm"
            footer={
              <>
                <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={renameMutation.isPending}
                  onClick={() => renameMutation.mutate({ id: renameTarget.id, name: renameValue })}
                >
                  {renameMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </>
            }
          >
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Device label"
              autoComplete="off"
            />
          </BaseModal>
        )}

        {revokeDeviceOpen && revokeDeviceTarget && (
          <BaseAlertDialog
            isOpen={revokeDeviceOpen}
            onClose={() => setRevokeDeviceOpen(false)}
            title="Revoke agent device"
            description={
              <>
                The agent will no longer be able to upload using this pairing. Type{" "}
                <span className="font-mono text-foreground">revoke</span> to confirm.
              </>
            }
            size="sm"
            footer={
              <>
                <Button type="button" variant="outline" onClick={() => setRevokeDeviceOpen(false)}>
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
              </>
            }
          >
            <Input
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
          </BaseAlertDialog>
        )}
      </div>
    </>
  );
}
