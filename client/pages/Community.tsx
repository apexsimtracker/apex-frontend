import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { BaseModal } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/ui/skeleton";
import DiscussionCard from "@/components/DiscussionCard";
import { DiscussionCategoryIcon } from "@/components/DiscussionCategoryIcon";
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
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthRedirectState } from "@/auth/authRedirect";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WithRootError } from "@/lib/formWithRootError";
import {
  newDiscussionFormSchema,
  type NewDiscussionFormValues,
} from "@/lib/validation/community";

const COMMUNITY_PATH = "/community";
const communityTitle = `Community | ${COMPANY_NAME}`;
const communityDescription = `Sim racing discussions, setups, and strategy on ${COMPANY_NAME} at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

const DESCRIPTION_TRUNCATE = 160;

function truncateDescription(text: string): string {
  const t = text.trim();
  if (t.length <= DESCRIPTION_TRUNCATE) return t;
  return t.slice(0, DESCRIPTION_TRUNCATE).trim() + "…";
}

const SEARCH_DEBOUNCE_MS = 300;

const emptyCategoryCounts = {
  all: 0,
  setup: 0,
  guides: 0,
  general: 0,
} as const;

export default function Community() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<DiscussionCategory>("all");
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
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    placeholderData: (previousData) => previousData,
  });

  const discussions = useMemo(
    () => (discussionPages?.pages.flatMap((p) => p.items) ?? []) as Discussion[],
    [discussionPages]
  );

  const error = discussionsQueryError
    ? discussionsQueryError instanceof Error
      ? discussionsQueryError.message
      : "Failed to load discussions."
    : null;

  /** Category/search changed: refetching first page (not “load more”). */
  const listRefetching =
    isFetching && !isFetchingNextPage && !loading;

  const createCategories = DISCUSSION_CATEGORIES.filter((c) => c.value !== "all");

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
        message: e instanceof Error ? e.message : "Failed to create discussion.",
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

  const hasFilters = selectedCategory !== "all" || searchQuery.trim().length > 0;
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
      <PageMeta title={communityTitle} description={communityDescription} path={COMMUNITY_PATH} />
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <h1 className="mb-2 text-3xl font-bold text-foreground sm:mb-3 sm:text-4xl">
            Sim Racing Community
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
            Connect with drivers, share setups, and discuss racing strategies.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-3 size-3.5 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border-white/4 w-full rounded-lg border bg-card/15 py-2.5 pl-8 pr-3 text-xs text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-[rgba(240,28,28,0.4)] focus:outline-none sm:py-2 sm:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={openNewDiscussion}
            className="whitespace-nowrap mt-2.5 sm:mt-0 rounded-lg px-3 py-2.5 text-xs font-medium text-white transition-colors sm:px-4 sm:py-2 sm:text-sm"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            New Discussion
          </button>
        </div>

        {/* Categories — All → category=all, Setups → setup, Guides → guides, General → general */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:mb-10 sm:gap-3 md:grid-cols-4">
          {DISCUSSION_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`rounded-lg p-3 text-center transition-all ${
                selectedCategory === cat.value
                  ? "border border-[rgba(240,28,28,0.5)] bg-[rgba(240,28,28,0.04)] text-foreground"
                  : "border-white/4 hover:bg-white/2 border text-foreground/70 hover:text-foreground"
              }`}
            >
              <span
                className={`mb-1 flex justify-center ${
                  selectedCategory === cat.value
                    ? "text-[rgb(240,28,28)]"
                    : "text-muted-foreground/70"
                }`}
              >
                <DiscussionCategoryIcon
                  categoryKey={cat.value}
                  className="size-5 sm:size-6"
                />
              </span>
              <p className="text-xs font-medium">{cat.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/50">
                {categoryCountsPending ? "—" : categoryCounts[cat.value]}
              </p>
            </button>
          ))}
        </div>

        {listRefetching && (
          <div
            className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-2.5 text-xs text-muted-foreground sm:text-sm"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-4 shrink-0 animate-spin text-[rgb(240,28,28)]" aria-hidden />
            <span>Loading discussions…</span>
          </div>
        )}

        {/* Discussions */}
        <div className="space-y-5 sm:space-y-6">
          {loading ? (
            <div className="space-y-5 sm:space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg border border-white/10 bg-card/20 p-4 sm:p-5"
                >
                  <div className="mb-4 flex gap-3">
                    <SkeletonBlock className="size-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBlock className="h-4 w-28 rounded" />
                      <SkeletonBlock className="h-3 w-20 rounded" />
                    </div>
                  </div>
                  <SkeletonBlock className="mb-3 h-3 w-24 rounded" />
                  <SkeletonBlock className="mb-2 h-5 w-full max-w-md rounded" />
                  <SkeletonBlock className="mb-2 h-4 w-full rounded" />
                  <SkeletonBlock className="h-4 max-w-sm w-full rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground/60">{error}</p>
            </div>
          ) : emptyMessage ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground/60">{emptyMessage}</p>
            </div>
          ) : (
            <>
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
                />
              ))}
              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* New Discussion Modal */}
      {showNewDiscussionModal && (
        <BaseModal
          isOpen={showNewDiscussionModal}
          onClose={closeModal}
          title="Create New Discussion"
          size="xl"
          mobileVariant="fullscreen"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" form="create-discussion-form" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </>
          }
        >
            <Form {...newDiscussionForm}>
              <form
                id="create-discussion-form"
                onSubmit={newDiscussionForm.handleSubmit(onCreateDiscussion)}
              >
                <FormRootMessage className="mb-4 text-xs" />

                <FormField
                  control={newDiscussionForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="mb-3 block text-sm font-medium text-foreground">
                        Category
                      </FormLabel>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {createCategories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              field.onChange(cat.value);
                            }}
                            className={cn(
                              "rounded-lg border p-3 text-sm font-medium transition-all",
                              field.value === cat.value
                                ? "border-primary/60 bg-primary/10 text-foreground"
                                : "text-foreground hover:border-border"
                            )}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newDiscussionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="mb-0.5 block text-sm font-medium text-foreground">
                        Discussion Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What's your question or topic?"
                          disabled={creating}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newDiscussionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="mb-0.5 block text-sm font-medium text-foreground">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your discussion in detail..."
                          disabled={creating}
                          className="h-32 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

              </form>
            </Form>
        </BaseModal>
      )}
    </div>
    </>
  );
}
