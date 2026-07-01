import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/skeleton";
import DiscussionCard from "@/components/DiscussionCard";
import { DiscussionCardSkeleton } from "@/components/DiscussionCardSkeleton";
import {
  getDiscussionsPage,
  getDiscussionCategoryCounts,
  DISCUSSIONS_PAGE_DEFAULT_LIMIT,
  createDiscussion,
  DISCUSSION_CATEGORIES,
  type Discussion,
  type DiscussionCategory,
} from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn, timeAgo } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthRedirectState } from "@/auth/authRedirect";
import type { WithRootError } from "@/lib/formWithRootError";
import {
  newDiscussionFormSchema,
  type NewDiscussionFormValues,
} from "@/lib/validation/community";
import NewDiscussionModalV2 from "@/pages/v2/community/NewDiscussionModalV2";

const COMMUNITY_V2_PATH = "/v2/community";
const communityTitle = `Community | ${COMPANY_NAME}`;
const communityDescription = `Sim racing discussions, setups, and strategy on ${COMPANY_NAME}.`;

const DESCRIPTION_TRUNCATE = 160;

function truncateDescription(text: string): string {
  const t = text.trim();
  if (t.length <= DESCRIPTION_TRUNCATE) return t;
  return t.slice(0, DESCRIPTION_TRUNCATE).trim() + "…";
}

const SEARCH_DEBOUNCE_MS = 200;

const emptyCategoryCounts = {
  all: 0,
  setup: 0,
  guides: 0,
  general: 0,
} as const;

const DISCUSSION_CARD_CLASS =
  "mb-3 rounded-xl border-l-2 border-l-v2-primary/50 bg-v2-surface-container-low";

function getCategoryChipLabel(value: DiscussionCategory): string {
  if (value === "all") return "All Posts";
  const row = DISCUSSION_CATEGORIES.find((c) => c.value === value);
  return row?.label ?? value;
}

export default function CommunityV2() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] =
    useState<DiscussionCategory>("all");
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const newDiscussionForm = useForm<WithRootError<NewDiscussionFormValues>>({
    resolver: zodResolver(newDiscussionFormSchema),
    defaultValues: {
      category: "setup",
      title: "",
      description: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (showNewDiscussionModal) {
      newDiscussionForm.reset({
        category: "setup",
        title: "",
        description: "",
      });
      newDiscussionForm.clearErrors("root");
    }
  }, [showNewDiscussionModal, newDiscussionForm]);

  const {
    data: categoryCounts = emptyCategoryCounts,
    isPending: categoryCountsPending,
  } = useQuery({
    queryKey: ["discussions", "category-counts"],
    queryFn: getDiscussionCategoryCounts,
  });

  const {
    data: discussionPages,
    isLoading: loading,
    isFetching,
    error: discussionsQueryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "discussions",
      "community",
      selectedCategory,
      searchQuery,
      DISCUSSIONS_PAGE_DEFAULT_LIMIT,
    ],
    queryFn: ({ pageParam }) =>
      getDiscussionsPage({
        category: selectedCategory,
        q: searchQuery.trim() || undefined,
        page: pageParam as number,
        limit: DISCUSSIONS_PAGE_DEFAULT_LIMIT,
        includeTotal: false,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    placeholderData: (previousData) => previousData,
  });

  const discussions = useMemo(
    () =>
      (discussionPages?.pages.flatMap((p) => p.items) ?? []) as Discussion[],
    [discussionPages],
  );

  const error = discussionsQueryError
    ? discussionsQueryError instanceof Error
      ? discussionsQueryError.message
      : "Failed to load discussions."
    : null;

  const listRefetching = isFetching && !isFetchingNextPage && !loading;

  const onCreateDiscussion = async (values: NewDiscussionFormValues) => {
    newDiscussionForm.clearErrors("root");
    try {
      setCreating(true);
      await createDiscussion({
        category: values.category,
        title: values.title.trim(),
        description: values.description.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setShowNewDiscussionModal(false);
      newDiscussionForm.reset({
        category: "setup",
        title: "",
        description: "",
      });
      newDiscussionForm.clearErrors("root");
    } catch (e) {
      console.error(e);
      newDiscussionForm.setError("root", {
        type: "server",
        message:
          e instanceof Error ? e.message : "Failed to create discussion.",
      });
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    if (creating) return;
    setShowNewDiscussionModal(false);
    newDiscussionForm.clearErrors("root");
  };

  const openNewDiscussion = useCallback(() => {
    if (!user) {
      const state: AuthRedirectState = {
        message: "Sign in to start a discussion.",
        from: `${location.pathname}${location.search}`,
      };
      navigate("/login", { state });
      return;
    }
    setShowNewDiscussionModal(true);
  }, [user, navigate, location.pathname, location.search]);

  const hasFilters =
    selectedCategory !== "all" || searchQuery.trim().length > 0;
  const emptyMessage =
    loading || error
      ? null
      : discussions.length === 0
        ? hasFilters
          ? "No discussions match your search."
          : "No discussions yet. Start one!"
        : null;

  return (
    <>
      <PageMeta
        title={communityTitle}
        description={communityDescription}
        path={COMMUNITY_V2_PATH}
      />
      <div className="relative mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto px-6 pb-28 pt-5">
        <section className="mb-5">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Sim Racing Community
          </h1>
          <p className="mt-1 font-v2-body text-sm text-v2-on-surface-variant">
            Connect with drivers, share setups, and discuss racing strategies.
          </p>
        </section>

        <div className="relative mb-5">
          <Search
            className="absolute left-3 top-3 size-4 text-v2-on-surface-variant/60"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container py-2.5 pl-10 pr-4 font-v2-body text-sm text-v2-on-surface transition-colors placeholder:text-v2-on-surface-variant/60 focus:border-v2-primary/40 focus:outline-none"
          />
        </div>

        <section className="mb-5 grid grid-cols-4 gap-2">
          {DISCUSSION_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "rounded p-2 font-v2-body text-[10px] font-bold uppercase transition-colors",
                  isActive
                    ? "bg-v2-primary text-white"
                    : "bg-v2-surface-container-low text-v2-on-surface-variant",
                )}
              >
                <span className="block truncate">
                  {getCategoryChipLabel(cat.value)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-[9px] font-semibold tabular-nums",
                    isActive
                      ? "text-white/80"
                      : "text-v2-on-surface-variant/60",
                  )}
                >
                  {categoryCountsPending ? (
                    <SkeletonBlock className="mx-auto h-2.5 w-4 rounded" />
                  ) : (
                    categoryCounts[cat.value]
                  )}
                </span>
              </button>
            );
          })}
        </section>

        <h2 className="mb-3 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
          Recent
        </h2>

        <div className="space-y-3">
          {listRefetching && (
            <DiscussionCardSkeleton count={2} className="mb-2 space-y-3" />
          )}
          {loading ? (
            <DiscussionCardSkeleton count={4} />
          ) : error ? (
            <div className="py-12 text-center">
              <p className="font-v2-body text-sm text-v2-on-surface-variant">
                {error}
              </p>
            </div>
          ) : emptyMessage ? (
            <div className="py-12 text-center">
              <p className="font-v2-body text-sm text-v2-on-surface-variant">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "space-y-3",
                listRefetching && "pointer-events-none opacity-60",
              )}
              aria-busy={listRefetching || undefined}
            >
              {discussions.map((d) => (
                <DiscussionCard
                  key={d.id}
                  id={d.id}
                  title={d.title}
                  excerpt={
                    d.excerpt ??
                    truncateDescription(d.content ?? d.description ?? d.title)
                  }
                  author={d.author}
                  categoryKey={d.category ?? "general"}
                  timestamp={timeAgo(d.createdAt)}
                  replies={d.commentCount ?? d.commentsCount ?? d.replies ?? 0}
                  views={d.views ?? 0}
                  isPinned={d.isPinned}
                  wasEdited={Boolean(d.wasEdited || d.editedAt)}
                  className={DISCUSSION_CARD_CLASS}
                />
              ))}
              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container px-4 py-2 font-v2-body text-sm text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={openNewDiscussion}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom)+1rem)] right-6 z-40 flex size-14 items-center justify-center rounded-full bg-v2-primary text-white shadow-2xl transition-colors hover:bg-v2-primary/90"
          aria-label="New discussion"
        >
          <Plus className="size-6" aria-hidden />
        </button>

        <NewDiscussionModalV2
          open={showNewDiscussionModal}
          onOpenChange={(open) => {
            if (!open) {
              closeModal();
              return;
            }
            setShowNewDiscussionModal(true);
          }}
          form={newDiscussionForm}
          creating={creating}
          onSubmit={onCreateDiscussion}
        />
      </div>
    </>
  );
}
