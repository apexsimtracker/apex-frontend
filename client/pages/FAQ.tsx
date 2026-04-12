import { useState, useMemo, useId, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { BRAND_RED } from "@/lib/appConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FAQ_ITEMS,
  filterFaqItems,
  groupFaqByCategory,
  type FaqItem,
} from "@/lib/faqData";

const PATH = "/faq";

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => filterFaqItems(FAQ_ITEMS, query), [query]);
  const total = FAQ_ITEMS.length;
  const shown = filtered.length;

  const title = `FAQ | ${COMPANY_NAME}`;
  const description = `Answers about ${COMPANY_NAME}, sessions, Apex Pro, and your account at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

  const showEmpty = query.trim().length > 0 && shown === 0;

  const resetSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <>
      <PageMeta title={title} description={description} path={PATH} />
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <header className="mb-8 text-center sm:mb-10">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Frequently Asked Questions
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Search by keyword to jump to an answer, or browse the topics below. Still stuck? Reach out via the
                support email in the footer.
              </p>
            </header>

            <div className="relative mb-4">
              <label htmlFor={searchId} className="sr-only">
                Search frequently asked questions
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                ref={inputRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions and answers…"
                autoComplete="off"
                spellCheck={false}
                className="h-11 pl-10 pr-[5.5rem] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[rgb(240,28,28)]"
                aria-controls="faq-accordion"
              />
              {query.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetSearch}
                  className="absolute right-1 top-1/2 h-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  Clear
                </Button>
              )}
            </div>

            <p className="mb-6 text-xs text-muted-foreground sm:text-sm" aria-live="polite">
              Showing {shown} of {total} questions
            </p>

            {showEmpty ? (
              <div
                className="rounded-xl border border-white/10 bg-card/50 px-6 py-10 text-center"
                role="status"
              >
                <p className="mb-6 text-sm text-muted-foreground">
                  No questions found matching your search.
                </p>
                <Button
                  type="button"
                  onClick={resetSearch}
                  className="text-white focus-visible:ring-ring"
                  style={{ backgroundColor: BRAND_RED }}
                >
                  Reset search
                </Button>
              </div>
            ) : (
              <FaqAccordion sections={groupFaqByCategory(filtered)} query={query} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FaqAccordion({
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
        <FaqCategorySection
          key={category}
          category={category}
          items={items}
          query={query}
        />
      ))}
    </div>
  );
}

function FaqCategorySection({
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
      <h2
        id={`faq-section-${sectionSlug}`}
        className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground"
      >
        {category}
      </h2>
      <Accordion
        type="single"
        collapsible
        value={openValue}
        onValueChange={setOpenValue}
        className="w-full space-y-2"
      >
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="rounded-lg border border-white/10 bg-card/50 px-1 transition-colors data-[state=open]:ring-1 data-[state=open]:ring-[rgb(240,28,28)] sm:px-2"
          >
            <AccordionTrigger className="rounded-md px-3 py-4 text-left text-sm text-foreground hover:bg-muted/50 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(240,28,28)] focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-[15px] [&[data-state=open]]:text-foreground">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}
