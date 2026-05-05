import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminUserList,
  postAdminDisposableEmailScan,
  type AdminUserListParams,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
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
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const TITLE = `Admin · Users | ${COMPANY_NAME}`;
const SEARCH_DEBOUNCE_MS = 300;

function RoleBadge({ role }: { role: "USER" | "ADMIN" }) {
  const isAdmin = role === "ADMIN";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        isAdmin
          ? "border-purple-500/40 bg-purple-500/15 text-purple-200"
          : "border-blue-500/40 bg-blue-500/15 text-blue-200"
      )}
    >
      {isAdmin ? "Admin" : "User"}
    </span>
  );
}

function AccountBadge({
  isDeleted,
  suspendedAt,
}: {
  isDeleted: boolean;
  suspendedAt: string | null;
}) {
  if (isDeleted) {
    return (
      <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
        Deleted
      </span>
    );
  }
  if (suspendedAt) {
    return (
      <span className="inline-flex rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-200">
        Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-200">
      Active
    </span>
  );
}

function SuspiciousBadge() {
  return (
    <span className="inline-flex rounded-full border border-amber-500/45 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-100">
      Suspicious
    </span>
  );
}

function PlanBadge({
  plan,
  entitlementStatus,
}: {
  plan: "FREE" | "PRO";
  entitlementStatus: string | null;
}) {
  if (plan === "PRO") {
    const warn =
      entitlementStatus === "PAST_DUE" ? " · Past due" : entitlementStatus === "CANCELED" ? " · Canceled" : "";
    return (
      <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
        Pro{warn}
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      Free
    </span>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, riskFilter]);

  const listParams = useMemo((): AdminUserListParams => {
    const role: "USER" | "ADMIN" | undefined =
      roleFilter === "USER" || roleFilter === "ADMIN" ? roleFilter : undefined;
    const status: "active" | "suspended" | "deleted" | undefined =
      statusFilter === "active" || statusFilter === "suspended" || statusFilter === "deleted"
        ? statusFilter
        : undefined;
    const suspiciousOnly = riskFilter === "suspicious";
    return {
      page,
      pageSize: 20,
      ...(debouncedSearch.trim() ? { q: debouncedSearch.trim() } : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(suspiciousOnly ? { suspiciousOnly: true } : {}),
    };
  }, [page, debouncedSearch, roleFilter, statusFilter, riskFilter]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin", "users", listParams],
    queryFn: () => fetchAdminUserList(listParams),
  });

  const previewDisposableScan = useMutation({
    mutationFn: () => postAdminDisposableEmailScan({ dryRun: true }),
    onSuccess: (data) => {
      if (data.dryRun) {
        setScanDialogOpen(true);
      }
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Scan failed.");
    },
  });

  const applyDisposableScan = useMutation({
    mutationFn: () => postAdminDisposableEmailScan({ dryRun: false }),
    onSuccess: (data) => {
      if (data.dryRun !== false) return;
      toast.success(
        data.updated === 0
          ? "No accounts needed updating."
          : `Flagged ${data.updated} account(s).`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setScanDialogOpen(false);
      previewDisposableScan.reset();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not apply flags.");
    },
  });

  const previewData = previewDisposableScan.data?.dryRun === true
    ? previewDisposableScan.data
    : undefined;

  const rows = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const currentPage = data?.page ?? page;

  const rangeLabel = useMemo(() => {
    if (total === 0) return "Showing 0 of 0 results";
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    const noun = total === 1 ? "result" : "results";
    return `Showing ${start}–${end} of ${total} ${noun}`;
  }, [total, currentPage, pageSize]);

  return (
    <>
      <Dialog
        open={scanDialogOpen}
        onOpenChange={(open) => {
          setScanDialogOpen(open);
          if (!open) {
            previewDisposableScan.reset();
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Disposable email scan</DialogTitle>
            <DialogDescription>
              Scan for accounts using disposable email domains.
            </DialogDescription>
          </DialogHeader>
          {previewData ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 py-2">
              <p className="text-sm text-foreground">
                Scanned{" "}
                <span className="tabular-nums font-medium">{previewData.scanned}</span>{" "}
                accounts ·{" "}
                <span className="tabular-nums font-medium">{previewData.totalMatching}</span>{" "}
                use a disposable domain
                {previewData.pendingFlagCount > 0 ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="tabular-nums font-medium text-amber-100">
                      {previewData.pendingFlagCount}
                    </span>{" "}
                    not yet flagged
                  </>
                ) : null}
              </p>
              {previewData.matchesTruncated ? (
                <p className="text-xs text-amber-200/90">
                  Showing the first {previewData.matching.length} matches in this list; total
                  matching is {previewData.totalMatching}.
                </p>
              ) : null}
              {previewData.totalMatching === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No accounts match disposable domains.
                </p>
              ) : (
                <div className="min-h-0 flex-1 overflow-auto rounded-md border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="p-2">Email</th>
                        <th className="p-2">Status</th>
                        <th className="w-16 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.matching.map((m) => (
                        <tr key={m.id} className="border-b border-white/5">
                          <td className="p-2 font-mono text-xs text-foreground">{m.email}</td>
                          <td className="p-2 text-xs">
                            {m.alreadyFlagged ? (
                              <span className="text-muted-foreground">Already flagged</span>
                            ) : (
                              <span className="text-amber-100">Will flag</span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            <Link
                              to={`/admin/users/${m.id}`}
                              className="text-xs text-primary underline-offset-4 hover:underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScanDialogOpen(false)}
                  disabled={applyDisposableScan.isPending}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  disabled={
                    previewData.pendingFlagCount === 0 || applyDisposableScan.isPending
                  }
                  onClick={() => applyDisposableScan.mutate()}
                >
                  {applyDisposableScan.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : null}
                  Flag {previewData.pendingFlagCount} account
                  {previewData.pendingFlagCount === 1 ? "" : "s"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <PageMeta path="/admin/users" title={TITLE} description="Manage users and moderation." noindex />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and filter accounts. Open a user for full details, edits, and moderation.
          </p>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error instanceof ApiError ? error.message : "Could not load users."}
          </div>
        )}

        {!isError && (
          <div className="rounded-xl border border-white/10">
            <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <Input
                  placeholder="Search email or name…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full min-w-[12rem] max-w-xs"
                />
                <select
                  className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm"
                  value={roleFilter}
                  onChange={(e) => {
                    setPage(1);
                    setRoleFilter(e.target.value);
                  }}
                  aria-label="Role"
                >
                  <option value="">All roles</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <select
                  className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  aria-label="Account status"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>
                <select
                  className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm"
                  value={riskFilter}
                  onChange={(e) => {
                    setPage(1);
                    setRiskFilter(e.target.value);
                  }}
                  aria-label="Risk"
                >
                  <option value="">All accounts</option>
                  <option value="suspicious">Suspicious only</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={
                    previewDisposableScan.isPending || applyDisposableScan.isPending
                  }
                  onClick={() => previewDisposableScan.mutate()}
                >
                  {previewDisposableScan.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : null}
                  Check disposable emails
                </Button>
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
                <p className="text-sm font-medium text-foreground">No users match</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another search, role, or status filter.
                </p>
                {(searchInput.trim() || roleFilter || statusFilter || riskFilter) && (
                  <button
                    type="button"
                    className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setSearchInput("");
                      setRoleFilter("");
                      setStatusFilter("");
                      setRiskFilter("");
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Account</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Joined</th>
                      <th className="w-12 p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className={cn("border-b border-white/5", r.isDeleted && "opacity-70")}
                      >
                        <td className="p-3">
                          <div className="font-medium text-foreground">{r.displayName}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">{r.email}</span>
                            {r.isSuspicious ? <SuspiciousBadge /> : null}
                          </div>
                        </td>
                        <td className="p-3">
                          <RoleBadge role={r.role} />
                        </td>
                        <td className="p-3">
                          <AccountBadge isDeleted={r.isDeleted} suspendedAt={r.suspendedAt} />
                        </td>
                        <td className="p-3">
                          <PlanBadge plan={r.plan} entitlementStatus={r.entitlementStatus} />
                        </td>
                        <td className="p-3 tabular-nums text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Actions">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/users/${r.id}`}>View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/users/${r.id}?edit=1`}>Edit</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  void navigator.clipboard.writeText(r.id);
                                }}
                              >
                                Copy user id
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
            <span className="self-center text-xs text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
