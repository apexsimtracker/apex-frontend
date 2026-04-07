import { useState, useEffect, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import DiscussionCard from "@/components/DiscussionCard";
import { DiscussionCategoryIcon } from "@/components/DiscussionCategoryIcon";
import {
  getDiscussionsPage,
  DISCUSSIONS_PAGE_DEFAULT_LIMIT,
  createDiscussion,
  DISCUSSION_CATEGORIES,
  type Discussion,
  type DiscussionCategory,
} from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";

const COMMUNITY_PATH = "/community";
const communityTitle = `Community | ${COMPANY_NAME}`;
const communityDescription = `Sim racing discussions, setups, and strategy on ${COMPANY_NAME} at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

const DESCRIPTION_TRUNCATE = 160;

function truncateDescription(text: string): string {
  const t = text.trim();
  if (t.length <= DESCRIPTION_TRUNCATE) return t;
  return t.slice(0, DESCRIPTION_TRUNCATE).trim() + "…";
}

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 5000;

export default function Community() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<DiscussionCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");
  const [newDiscussionCategory, setNewDiscussionCategory] =
    useState<DiscussionCategory>("setup");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    category?: string;
  }>({});

  const { data: categoryCounts = { all: 0, setup: 0, guides: 0, general: 0 } } = useQuery({
    queryKey: ["discussions", "category-totals"],
    queryFn: async () => {
      const [all, setup, guides, general] = await Promise.all([
        getDiscussionsPage({ category: "all", page: 1, limit: 1 }),
        getDiscussionsPage({ category: "setup", page: 1, limit: 1 }),
        getDiscussionsPage({ category: "guides", page: 1, limit: 1 }),
        getDiscussionsPage({ category: "general", page: 1, limit: 1 }),
      ]);
      return {
        all: all.total,
        setup: setup.total,
        guides: guides.total,
        general: general.total,
      };
    },
  });

  const {
    data: discussionPages,
    isLoading: loading,
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

  // Debounce search input -> searchQuery (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const categoryLabel = (value: string) =>
    DISCUSSION_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  const createCategories = DISCUSSION_CATEGORIES.filter((c) => c.value !== "all");

  const validateForm = (): boolean => {
    const errs: { title?: string; description?: string; category?: string } = {};
    const title = newDiscussionTitle.trim();
    const description = newDiscussionContent.trim();
    if (!title) errs.title = "Title is required.";
    else if (title.length < TITLE_MIN) errs.title = `Title must be at least ${TITLE_MIN} characters.`;
    else if (title.length > TITLE_MAX) errs.title = `Title must be ${TITLE_MAX} characters or less.`;
    if (!description) errs.description = "Description is required.";
    else if (description.length < DESCRIPTION_MIN) errs.description = `Description must be at least ${DESCRIPTION_MIN} characters.`;
    else if (description.length > DESCRIPTION_MAX) errs.description = `Description must be ${DESCRIPTION_MAX} characters or less.`;
    const validCategory = createCategories.some((c) => c.value === newDiscussionCategory);
    if (!validCategory) errs.category = "Please select a category.";
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateDiscussion = async () => {
    setCreateError(null);
    setValidationErrors({});
    if (!validateForm()) return;

    const title = newDiscussionTitle.trim();
    const description = newDiscussionContent.trim();

    try {
      setCreating(true);
      await createDiscussion({
        category: newDiscussionCategory,
        title,
        description,
      });
      await queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setShowNewDiscussionModal(false);
      setNewDiscussionTitle("");
      setNewDiscussionContent("");
      setNewDiscussionCategory("setup");
      setValidationErrors({});
      setCreateError(null);
    } catch (e) {
      console.error(e);
      setCreateError(e instanceof Error ? e.message : "Failed to create discussion.");
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    if (creating) return;
    setShowNewDiscussionModal(false);
    setNewDiscussionTitle("");
    setNewDiscussionContent("");
    setNewDiscussionCategory("setup");
    setCreateError(null);
    setValidationErrors({});
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
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground/40" />
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
                {categoryCounts[cat.value]}
              </p>
            </button>
          ))}
        </div>

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

            {createError && (
              <div className="mb-4 text-sm text-neutral-400">{createError}</div>
            )}

            {/* Category Selection — backend values: setup | guides | general */}
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-3 block">
                Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {createCategories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setNewDiscussionCategory(cat.value)}
                    className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                      newDiscussionCategory === cat.value
                        ? "border-2 text-foreground"
                        : "border text-foreground hover:border-white/10"
                    }`}
                    style={
                      newDiscussionCategory === cat.value
                        ? { borderColor: "rgb(240, 28, 28)" }
                        : {}
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {validationErrors.category && (
                <p className="mt-1 text-xs text-neutral-400">{validationErrors.category}</p>
              )}
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Discussion Title
              </label>
              <input
                type="text"
                placeholder="What's your question or topic?"
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              {validationErrors.title && (
                <p className="mt-1 text-xs text-neutral-400">{validationErrors.title}</p>
              )}
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description
              </label>
              <textarea
                placeholder="Describe your discussion in detail..."
                value={newDiscussionContent}
                onChange={(e) => setNewDiscussionContent(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none h-32"
              />
              {validationErrors.description && (
                <p className="mt-1 text-xs text-neutral-400">{validationErrors.description}</p>
              )}
            </div>

            {/* Actions */}
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
                type="button"
                onClick={handleCreateDiscussion}
                disabled={creating}
                className="px-6 py-2 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
