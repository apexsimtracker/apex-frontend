import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import { cardClassName } from "./publicHomeV2Shared";

export default function PublicHomeFaqStripV2() {
  return (
    <section
      className={cn(
        cardClassName,
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="flex gap-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary"
          aria-hidden
        >
          <HelpCircle className="size-5" />
        </div>
        <div>
          <p className="font-v2-body text-sm font-medium text-v2-on-surface">
            Have questions about Apex?
          </p>
          <p className="mt-1 max-w-sm font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            Plans, sessions, Pro, and more — we&apos;ve collected answers in one
            place.
          </p>
        </div>
      </div>
      <Button
        asChild
        className={cn(
          "shrink-0 !px-5 !py-2 !text-xs",
          v2PrimaryButtonClassName,
        )}
      >
        <Link to="/v2/faq">
          Read the FAQ
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </section>
  );
}
