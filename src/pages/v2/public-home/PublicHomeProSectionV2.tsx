import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { accentPanelClassName, PRO_FEATURES } from "./publicHomeV2Shared";
import { IconChip } from "./PublicHomeIconChipV2";

export default function PublicHomeProSectionV2() {
  return (
    <section className={accentPanelClassName}>
      <IconChip>
        <Sparkles className="size-5" />
      </IconChip>
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Apex Pro
      </h2>
      <p className="mt-2 max-w-lg font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        Automatic telemetry uploads, Apex Agent access, full analytics, and
        future Pro-only challenges — unlock after you join.
      </p>
      <ul className="mt-6 grid max-w-md gap-3 sm:grid-cols-2">
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
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild className={v2PrimaryButtonClassName}>
          <Link to="/v2/signup">Get started</Link>
        </Button>
        <Button asChild className={v2OutlineButtonClassName}>
          <Link to="/v2/login">Already have an account?</Link>
        </Button>
      </div>
      <Link
        to="/v2/pricing"
        className="mt-4 inline-block font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
      >
        View pricing
      </Link>
    </section>
  );
}
