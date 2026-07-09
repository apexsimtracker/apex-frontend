import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  HelpCircle,
  Info,
  MessageCircle,
  Search,
  SearchX,
  Sparkles,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PageMeta from "@/components/PageMeta";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import {
  FAQ_CATEGORY_ORDER,
  FAQ_ITEMS,
  filterFaqItems,
  groupFaqByCategory,
  type FaqItem,
} from "@/lib/faqData";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

const FAQ_V2_PATH = "/v2/faq";
const title = `Frequently Asked Questions | ${COMPANY_NAME}`;
const description = `Answers about ${COMPANY_NAME}, sessions, Apex Pro, and your account.`;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  General: Info,
  "Sessions & Data": Database,
  "Apex Pro": Sparkles,
  Account: UserCog,
};

const FILTER_CHIPS = ["All", ...FAQ_CATEGORY_ORDER] as const;

const categoryCounts = Object.fromEntries([
  ["All", FAQ_ITEMS.length],
  ...FAQ_CATEGORY_ORDER.map((cat) => [
    cat,
    FAQ_ITEMS.filter((item) => item.category === cat).length,
  ]),
]) as Record<(typeof FILTER_CHIPS)[number], number>;

export default function FAQV2() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const bySearch = filterFaqItems(FAQ_ITEMS, query);
    if (!category) return bySearch;
    return bySearch.filter((item) => item.category === category);
  }, [query, category]);

  const sections = useMemo(() => groupFaqByCategory(filtered), [filtered]);

  const total = FAQ_ITEMS.length;
  const shown = filtered.length;
  const showEmpty =
    (query.trim().length > 0 || category !== null) && shown === 0;

  const resetFilters = () => {
    setQuery("");
    setCategory(null);
    inputRef.current?.focus();
  };

  return (
    <>
      <PageMeta title={title} description={description} path={FAQ_V2_PATH} />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-8 px-6 py-8">
        <section className="mb-1">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Frequently Asked Questions
          </h1>
          <p className="mt-1 font-v2-body text-sm text-v2-on-surface-variant">
            Search by keyword to jump to an answer, or browse the topics below.
            Still stuck? Reach out via the support email in the footer.
          </p>
        </section>

        <div className="space-y-5">
          <div className="relative">
            <label htmlFor="faq-search" className="sr-only">
              Search frequently asked questions
            </label>
            <Search
              className="absolute left-3 top-3 size-4 text-v2-on-surface-variant/60"
              aria-hidden
            />
            <input
              ref={inputRef}
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions and answers…"
              autoComplete="off"
              spellCheck={false}
              aria-controls="faq-accordion"
              className="w-full rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container py-2.5 pl-10 pr-16 font-v2-body text-sm text-v2-on-surface transition-colors placeholder:text-v2-on-surface-variant/60 focus:border-v2-primary/40 focus:outline-none"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-v2-body text-xs text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {FILTER_CHIPS.map((chip) => {
              const isAll = chip === "All";
              const isActive = isAll ? category === null : category === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setCategory(isAll ? null : chip)}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded p-2 font-v2-body text-[10px] font-bold uppercase transition-colors",
                    isActive
                      ? "bg-v2-primary text-white"
                      : "bg-v2-surface-container-low text-v2-on-surface-variant",
                  )}
                  aria-pressed={isActive}
                >
                  <span className="truncate">{chip}</span>
                  <span
                    className={cn(
                      "shrink-0 font-semibold tabular-nums",
                      isActive
                        ? "text-white/80"
                        : "text-v2-on-surface-variant/60",
                    )}
                  >
                    ({categoryCounts[chip]})
                  </span>
                </button>
              );
            })}
          </section>

          <p
            className="font-v2-body text-xs text-v2-on-surface-variant"
            aria-live="polite"
          >
            Showing {shown} of {total} questions
          </p>
        </div>

        {showEmpty ? (
          <div
            className="rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low px-6 py-10 text-center"
            role="status"
          >
            <div
              className="mx-auto mb-4 flex size-10 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary"
              aria-hidden
            >
              <SearchX className="size-5" />
            </div>
            <p className="mb-6 font-v2-body text-sm text-v2-on-surface-variant">
              No questions found matching your search.
            </p>
            <Button
              type="button"
              onClick={resetFilters}
              className={v2PrimaryButtonClassName}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <FaqAccordionV2 sections={sections} query={query} />
        )}

        <section className="rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-6 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary"
                aria-hidden
              >
                <MessageCircle className="size-5" />
              </div>
              <div>
                <p className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                  Still have questions?
                </p>
                <p className="mt-1 max-w-sm font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                  Can&apos;t find what you&apos;re looking for? Our support team
                  is here to help.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="shrink-0 rounded-v2-sm bg-v2-primary px-4 py-2 font-v2-body text-xs font-semibold text-white transition-colors hover:bg-v2-primary/90"
            >
              <Link to="/v2/contact">Contact support</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

function FaqAccordionV2({
  sections,
  query,
}: {
  sections: { category: string; items: FaqItem[] }[];
  query: string;
}) {
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  if (totalItems === 0) return null;

  return (
    <div id="faq-accordion" className="w-full space-y-10">
      {sections.map(({ category, items }) => (
        <FaqCategorySectionV2
          key={category}
          category={category}
          items={items}
          query={query}
        />
      ))}
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const Icon = CATEGORY_ICONS[category] ?? HelpCircle;
  return <Icon className="size-4" />;
}

function FaqCategorySectionV2({
  category,
  items,
  query,
}: {
  category: string;
  items: FaqItem[];
  query: string;
}) {
  const [openValue, setOpenValue] = useState<string>("");

  useEffect(() => {
    if (query.trim()) {
      setOpenValue("");
    }
  }, [query]);

  const sectionSlug = slugify(category);

  return (
    <section aria-labelledby={`faq-section-${sectionSlug}`}>
      <div className="flex items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary"
          aria-hidden
        >
          <CategoryIcon category={category} />
        </div>
        <h2
          id={`faq-section-${sectionSlug}`}
          className="font-v2-headline text-lg font-semibold text-v2-on-surface"
        >
          {category}
        </h2>
        <span className="rounded-v2-sm bg-v2-surface-container px-2 py-0.5 font-v2-body text-[11px] font-medium text-v2-on-surface-variant">
          {items.length}
        </span>
      </div>
      <Accordion
        type="single"
        collapsible
        value={openValue}
        onValueChange={setOpenValue}
        className="mt-4 w-full space-y-2"
      >
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="group overflow-hidden rounded-xl border border-b-0 border-v2-outline-variant/15 bg-v2-surface-container-low transition-colors hover:bg-v2-surface-container data-[state=open]:border-v2-primary data-[state=open]:bg-v2-surface-container"
          >
            <AccordionTrigger className="w-full p-4 text-left font-v2-headline text-sm text-v2-on-surface hover:bg-transparent hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary focus-visible:ring-offset-2 focus-visible:ring-offset-v2-background [&[data-state=open]]:text-v2-on-surface">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}
