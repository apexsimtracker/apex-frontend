import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
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
import { timeAgo } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
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
      <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3">
            Sim Racing Community
          </h1>
          <p className="text-muted-foreground/70 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Connect with drivers, share setups, and discuss racing strategies.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 sm:mb-10 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-3 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-card/15 border border-white/4 rounded-lg text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-[rgba(240,28,28,0.4)] text-xs sm:text-sm transition-colors"
            />
          </div>
          <button
            onClick={() => setShowNewDiscussionModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            New Discussion
          </button>
        </div>

        {/* Categories — All → category=all, Setups → setup, Guides → guides, General → general */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-8 sm:mb-10">
          {DISCUSSION_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-3 rounded-lg transition-all text-center ${
                selectedCategory === cat.value
                  ? "border border-[rgba(240,28,28,0.5)] text-foreground bg-[rgba(240,28,28,0.04)]"
                  : "border border-white/4 text-foreground/70 hover:text-foreground hover:bg-white/2"
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
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </span>
              <p className="font-medium text-xs">{cat.label}</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                {categoryCountsPending ? "—" : categoryCounts[cat.value]}
              </p>
            </button>
          ))}
        </div>

        {listRefetching && (
          <div
            className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-2.5 text-xs sm:text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[rgb(240,28,28)]" aria-hidden />
            <span>Loading discussions…</span>
          </div>
        )}

        {/* Discussions */}
        <div className="space-y-5 sm:space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground/60 text-sm">Loading discussions…</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground/60 text-sm">{error}</p>
            </div>
          ) : emptyMessage ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground/60 text-sm">{emptyMessage}</p>
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
                  views={d.likeCount ?? d.views ?? 0}
                  isPinned={d.isPinned}
                />
              ))}
              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.08] disabled:opacity-50 disabled:pointer-events-none transition-colors"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border border border-white/10 max-w-2xl w-full p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Create New Discussion
            </h2>

            <Form {...newDiscussionForm}>
              <form onSubmit={newDiscussionForm.handleSubmit(onCreateDiscussion)}>
                <FormRootMessage className="mb-4 text-xs" />

                <FormField
                  control={newDiscussionForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel className="text-sm font-medium text-foreground mb-3 block">
                        Category
                      </FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {createCategories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              field.onChange(cat.value);
                            }}
                            className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                              field.value === cat.value
                                ? "border-2 text-foreground"
                                : "border text-foreground hover:border-white/10"
                            }`}
                            style={
                              field.value === cat.value
                                ? { borderColor: "rgb(240, 28, 28)" }
                                : {}
                            }
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
                      <FormLabel className="text-sm font-medium text-foreground mb-0.5 block">
                        Discussion Title
                      </FormLabel>
                      <FormControl>
                        <input
                          type="text"
                          placeholder="What's your question or topic?"
                          disabled={creating}
                          className="w-full px-4 py-3 bg-secondary border border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
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
                      <FormLabel className="text-sm font-medium text-foreground mb-0.5 block">
                        Description
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Describe your discussion in detail..."
                          disabled={creating}
                          className="w-full px-4 py-3 bg-secondary border border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={creating}
                    className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
                    style={{ backgroundColor: "rgb(240, 28, 28)" }}
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
