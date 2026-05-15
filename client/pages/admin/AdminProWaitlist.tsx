import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  downloadAdminWaitlistExport,
  fetchAdminWaitlistList,
  type AdminWaitlistRow,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { BaseModal } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Download } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TITLE = `Admin · Pro waitlist | ${COMPANY_NAME}`;
const SEARCH_DEBOUNCE_MS = 300;

function PlanBadge({
  plan,
  entitlementStatus,
}: {
  plan: "FREE" | "PRO";
  entitlementStatus: string | null;
}) {
  if (plan === "PRO") {
    const warn =
      entitlementStatus === "PAST_DUE"
        ? " · Past due"
        : entitlementStatus === "CANCELED"
          ? " · Canceled"
          : "";
    return (
      <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
        Pro{warn}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Free</span>;
}

function AccountFlags({ row }: { row: AdminWaitlistRow }) {
  if (row.isDeleted) {
    return (
      <span className="ml-2 inline-flex rounded-full border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
        Deleted
      </span>
    );
  }
  if (row.suspendedAt) {
    return (
      <span className="ml-2 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-200">
        Suspended
      </span>
    );
  }
  return null;
}

function mailtoWaitlistHref(row: AdminWaitlistRow): string {
  const subject = encodeURIComponent("Apex Pro waitlist");
  const body = encodeURIComponent(
    `Hi ${row.fullName},\n\n`
  );
  return `mailto:${encodeURIComponent(row.contactEmail)}?subject=${subject}&body=${body}`;
}

export default function AdminProWaitlist() {
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [detailRow, setDetailRow] = useState<AdminWaitlistRow | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, planFilter]);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: 20,
      ...(debouncedSearch.trim() ? { q: debouncedSearch.trim() } : {}),
      ...(planFilter === "FREE" || planFilter === "PRO"
        ? { plan: planFilter as "FREE" | "PRO" }
        : {}),
    }),
    [page, debouncedSearch, planFilter]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin", "waitlist", listParams],
    queryFn: () => fetchAdminWaitlistList(listParams),
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      downloadAdminWaitlistExport({
        ...(debouncedSearch.trim() ? { q: debouncedSearch.trim() } : {}),
        ...(planFilter === "FREE" || planFilter === "PRO"
          ? { plan: planFilter as "FREE" | "PRO" }
          : {}),
      }),
    onSuccess: () => {
      toast.success("CSV download started.");
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? e.message : "Could not export.");
    },
  });

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
      <BaseModal
        isOpen={!!detailRow}
        onClose={() => setDetailRow(null)}
        title="Waitlist entry"
        description="Details submitted for Apex Pro. Contact email may differ from the account email."
        size="md"
      >
          {detailRow && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{detailRow.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact email</p>
                <p className="font-mono text-foreground">{detailRow.contactEmail}</p>
              </div>
              {detailRow.company?.trim() ? (
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-foreground">{detailRow.company}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap text-foreground">
                  {detailRow.message?.trim() ? detailRow.message : "—"}
                </p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-mono text-sm text-foreground">{detailRow.accountEmail}</p>
                <div className="mt-1">
                  <PlanBadge
                    plan={detailRow.plan}
                    entitlementStatus={detailRow.entitlementStatus}
                  />
                  <AccountFlags row={detailRow} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  Joined{" "}
                  <span className="text-foreground">
                    {new Date(detailRow.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  Updated{" "}
                  <span className="text-foreground">
                    {new Date(detailRow.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to={`/admin/users/${detailRow.userId}`}>Open user in admin</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(detailRow.contactEmail);
                      toast.success("Contact email copied.");
                    } catch {
                      toast.error("Could not copy.");
                    }
                  }}
                >
                  Copy contact email
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={mailtoWaitlistHref(detailRow)} rel="noreferrer">
                    Email contact
                  </a>
                </Button>
              </div>
            </div>
          )}
      </BaseModal>

      <PageMeta path="/admin/waitlist" title={TITLE} description="Pro tier waitlist." noindex />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pro waitlist</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review signups, export for outreach, and open the linked account for moderation.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="mr-2 size-4" aria-hidden />
            )}
            Export CSV
          </Button>
        </div>

        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error instanceof ApiError ? error.message : "Could not load waitlist."}
          </div>
        )}

        {!isError && (
          <div className="rounded-xl border border-white/10">
            <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <Input
                  placeholder="Search name, email, company, message…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full min-w-[12rem] max-w-md"
                />
                <select
                  className="rounded-md border border-white/10 bg-card px-3 py-2 text-sm"
                  value={planFilter}
                  onChange={(e) => {
                    setPage(1);
                    setPlanFilter(e.target.value);
                  }}
                  aria-label="Plan"
                >
                  <option value="">All plans</option>
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                </select>
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
                <p className="text-sm font-medium text-foreground">No entries match</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another search or plan filter.
                </p>
                {(searchInput.trim() || planFilter) && (
                  <button
                    type="button"
                    className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setSearchInput("");
                      setPlanFilter("");
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
                      <th className="p-3">Name</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Account</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Joined</th>
                      <th className="p-3">Updated</th>
                      <th className="w-12 p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.userId} className="border-b border-white/5">
                        <td className="p-3 font-medium">{r.fullName}</td>
                        <td className="max-w-[14rem] truncate p-3 font-mono text-xs text-foreground">
                          {r.contactEmail}
                        </td>
                        <td className="max-w-[10rem] truncate p-3 text-muted-foreground">
                          {r.company?.trim() ? r.company : "—"}
                        </td>
                        <td className="p-3">
                          <Link
                            to={`/admin/users/${r.userId}`}
                            className={cn(
                              "font-mono text-xs text-primary underline-offset-4 hover:underline",
                              r.isDeleted && "text-muted-foreground line-through"
                            )}
                          >
                            {r.accountEmail}
                          </Link>
                          <AccountFlags row={r} />
                        </td>
                        <td className="p-3">
                          <PlanBadge plan={r.plan} entitlementStatus={r.entitlementStatus} />
                        </td>
                        <td className="p-3 tabular-nums text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 tabular-nums text-muted-foreground">
                          {new Date(r.updatedAt).toLocaleString()}
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
                                <Link to={`/admin/users/${r.userId}`}>View user</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDetailRow(r)}>
                                Review entry
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(r.contactEmail);
                                    toast.success("Contact email copied.");
                                  } catch {
                                    toast.error("Could not copy.");
                                  }
                                }}
                              >
                                Copy contact email
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={mailtoWaitlistHref(r)} rel="noreferrer">
                                  Email contact
                                </a>
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
