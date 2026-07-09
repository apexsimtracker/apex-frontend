import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import { PRO_FEATURES } from "./publicHomeV2Shared";

const proCardBorderStyle = {
  borderColor: "color-mix(in srgb, rgb(240, 28, 28) 60%, transparent)",
};

export default function PublicHomeProSectionV2() {
  return (
    <section
      className={cn(
        "relative rounded-xl border-2 bg-v2-surface-container-low p-6 sm:p-7",
      )}
      style={proCardBorderStyle}
    >
      <div className="absolute -top-3 left-6 flex items-center gap-1 rounded-v2-sm bg-v2-primary px-3 py-0.5 font-v2-headline text-xs font-medium text-white">
        <Sparkles className="size-3" aria-hidden />
        Pro
      </div>

      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary">
        <Sparkles className="size-6" aria-hidden />
      </div>
      <h2 className="text-center font-v2-headline text-lg font-semibold text-v2-on-surface">
        Apex Pro
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-center font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        Automatic telemetry uploads, Apex Agent access, full analytics, and
        future Pro-only challenges — unlock after you join.
      </p>
      <ul className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
        {PRO_FEATURES.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-start gap-2 font-v2-body text-sm text-v2-on-surface-variant"
          >
            <Icon
              className="mt-0.5 size-4 shrink-0 text-v2-on-surface"
              aria-hidden
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild className={v2PrimaryButtonClassName}>
          <Link to="/v2/signup">Get started</Link>
        </Button>
        <Button asChild className={v2OutlineButtonClassName}>
          <Link to="/v2/login">Already have an account?</Link>
        </Button>
      </div>
    </section>
  );
}
