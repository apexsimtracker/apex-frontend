import { Link } from "react-router-dom";
import { Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import { accentPanelClassName, cardClassName } from "./publicHomeV2Shared";
import { IconChip } from "./PublicHomeIconChipV2";

export default function PublicHomeInfoGridV2() {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className={cn(cardClassName, "flex flex-col justify-center")}>
        <IconChip className="mb-4">
          <Users className="size-5" />
        </IconChip>
        <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
          Questions?
        </h2>
        <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Plans, sessions, Pro, and more — we&apos;ve collected answers in one
          place.
        </p>
        <Button asChild className={cn("mt-5", v2OutlineButtonClassName)}>
          <Link to="/v2/faq">Read the FAQ</Link>
        </Button>
      </div>
      <div className={cn(accentPanelClassName, "flex flex-col justify-center")}>
        <IconChip className="mb-4">
          <Sparkles className="size-5" />
        </IconChip>
        <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
          Mission
        </h2>
        <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Give every sim racer — weekend warrior to esports pro — the insights
          they need to find the limit and go beyond it.
        </p>
        <Button asChild className={cn("mt-5", v2OutlineButtonClassName)}>
          <Link to="/v2/about">About us</Link>
        </Button>
      </div>
    </section>
  );
}
