import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  resolveApiUrl,
  getFollowersPage,
  getFollowingPage,
  FOLLOW_LIST_PAGE_SIZE,
  type FollowUser,
} from "@/lib/api";
import { profileKeys } from "@/lib/profileQueryKeys";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 300;

type FollowListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  listKind: "followers" | "following" | null;
};

function FollowRow({ f, onNavigate }: { f: FollowUser; onNavigate: () => void }) {
  const name = f.displayName?.trim() || "—";
  const initials =
    name && name.length >= 2
      ? name.slice(0, 2).toUpperCase()
      : name.slice(0, 1).toUpperCase() || "?";

  return (
    <li>
      <Link
        to={`/user/${encodeURIComponent(f.id)}`}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/40 px-3 py-2 hover:bg-card/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80 overflow-hidden shrink-0">
          {resolveApiUrl(f.avatarUrl) ? (
            <img
              src={resolveApiUrl(f.avatarUrl)!}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          {f.bio && (
            <p className="text-xs text-muted-foreground truncate">{f.bio}</p>
          )}
        </div>
      </Link>
    </li>
  );
}

export function FollowListDialog({
  open,
  onOpenChange,
  userId,
  listKind,
}: FollowListDialogProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput,
    SEARCH_DEBOUNCE_MS,
    open && listKind ? `${userId}:${listKind}` : undefined
  );

  useEffect(() => {
    if (open) {
      setPage(1);
      setSearchInput("");
    } else {
      setSearchInput("");
      setPage(1);
    }
  }, [open, listKind, userId]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const enabled = open && Boolean(userId) && listKind !== null;

  const { data, isPending, error } = useQuery({
    queryKey:
      listKind === null
        ? ["profile", "followList", "idle"]
        : profileKeys.followList(userId, listKind, page, debouncedSearch),
    queryFn: () =>
      listKind === "followers"
        ? getFollowersPage(userId, {
            page,
            limit: FOLLOW_LIST_PAGE_SIZE,
            q: debouncedSearch,
          })
        : getFollowingPage(userId, {
            page,
            limit: FOLLOW_LIST_PAGE_SIZE,
            q: debouncedSearch,
          }),
    enabled,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageLimit = data?.limit ?? FOLLOW_LIST_PAGE_SIZE;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageLimit + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(currentPage * pageLimit, total);
  const errMsg =
    error instanceof Error
      ? error.message
      : error
        ? "Failed to load list."
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col gap-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {listKind === "followers"
              ? "Followers"
              : listKind === "following"
                ? "Following"
                : ""}
          </DialogTitle>
        </DialogHeader>
        {enabled && (
          <div className="relative mt-4 mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              autoComplete="off"
            />
          </div>
        )}
        <div className="overflow-y-auto min-h-0 flex-1 -mx-1 px-1">
          {!enabled ? null : isPending ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : errMsg ? (
            <p className="text-sm text-destructive py-4">{errMsg}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {debouncedSearch.trim()
                ? listKind === "followers"
                  ? "No followers match your search."
                  : "No users match your search."
                : listKind === "followers"
                  ? "No followers yet."
                  : "Not following anyone yet."}
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((f) => (
                <FollowRow
                  key={f.id}
                  f={f}
                  onNavigate={() => onOpenChange(false)}
                />
              ))}
            </ul>
          )}
        </div>
        {enabled && !isPending && !errMsg && total > 0 && (
          <div className="mt-4 pt-2 border-t border-white/10 shrink-0 space-y-3">
            <p className="text-xs text-center text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {total}
            </p>
            {totalPages > 1 && (
              <RaceHistoryPagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                disabled={isPending}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
