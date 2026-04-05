import { useState, useMemo, useId, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS, filterFaqItems, type FaqItem } from "@/lib/faqData";

const PATH = "/faq";

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => filterFaqItems(FAQ_ITEMS, query), [query]);
  const total = FAQ_ITEMS.length;
  const shown = filtered.length;

  const title = `FAQ | ${COMPANY_NAME}`;
  const description = `Answers about ${COMPANY_NAME}, sessions, uploads, and your account at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

  const showEmpty = query.trim().length > 0 && shown === 0;

  const resetSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <>
      <PageMeta title={title} description={description} path={PATH} />
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto">
            <header className="text-center mb-10 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Frequently Asked Questions
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Search by keyword to jump to an answer, or browse the topics below. Still stuck? Reach out via the
                support email in the footer.
              </p>
            </header>

            <div className="relative mb-4">
              <label htmlFor={searchId} className="sr-only">
                Search frequently asked questions
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none"
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
                className="h-11 pl-10 pr-[5.5rem] bg-white/[0.03] border-white/15 text-foreground placeholder:text-white/35 focus-visible:border-primary/50 focus-visible:ring-primary/40"
                aria-controls="faq-accordion"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={resetSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mb-6" aria-live="polite">
              Showing {shown} of {total} questions
            </p>

            {showEmpty ? (
              <div
                className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center"
                role="status"
              >
                <p className="text-sm text-white/70 mb-6">
                  No questions found matching your search.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSearch}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  Reset search
                </Button>
              </div>
            ) : (
              <FaqAccordion items={filtered} query={query} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FaqAccordion({ items, query }: { items: FaqItem[]; query: string }) {
  const [openValue, setOpenValue] = useState<string>("");

  useEffect(() => {
    if (query.trim()) {
      setOpenValue("");
    }
  }, [query]);

  if (items.length === 0) return null;

  return (
    <Accordion
      id="faq-accordion"
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
          className="border-0 rounded-lg border border-white/10 bg-white/[0.02] px-1 sm:px-2 data-[state=open]:border-primary/45 data-[state=open]:shadow-[0_0_0_1px_hsl(var(--primary)/0.15)] transition-colors"
        >
          <AccordionTrigger className="text-left text-sm sm:text-[15px] text-foreground hover:no-underline py-4 px-3 rounded-md hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&[data-state=open]]:text-foreground">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-white/70 leading-relaxed px-3 pb-4">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
