import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appPrimaryButtonClassName } from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";
import { cardClassName } from "./publicHomeShared";

export default function PublicHomeFaqStrip() {
  return (
    <section
      className={cn(
        cardClassName,
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="flex gap-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary"
          aria-hidden
        >
          <HelpCircle className="size-5" />
        </div>
        <div>
          <p className="font-apex-body text-sm font-medium text-apex-on-surface">
            Have questions about Apex?
          </p>
          <p className="mt-1 max-w-sm font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
            Plans, sessions, Pro, and more — we&apos;ve collected answers in one
            place.
          </p>
        </div>
      </div>
      <Button
        asChild
        className={cn(
          "shrink-0 !px-5 !py-2 !text-xs",
          appPrimaryButtonClassName,
        )}
      >
        <Link to="/faq">
          Read the FAQ
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </section>
  );
}
