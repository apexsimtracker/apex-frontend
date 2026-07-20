import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { accentPanelClassName, PRO_FEATURES } from "./publicHomeShared";
import { IconChip } from "./PublicHomeIconChip";

export default function PublicHomeProSection() {
  return (
    <section className={accentPanelClassName}>
      <IconChip>
        <Sparkles className="size-5" />
      </IconChip>
      <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
        Apex Pro
      </h2>
      <p className="mt-2 max-w-lg font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
        Automatic telemetry uploads, Apex Agent access, full analytics, and
        future Pro-only challenges — unlock after you join.
      </p>
      <ul className="mt-6 grid max-w-md gap-3 sm:grid-cols-2">
        {PRO_FEATURES.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-start gap-2 font-apex-body text-sm text-apex-on-surface-variant"
          >
            <Icon
              className="mt-0.5 size-4 shrink-0 text-apex-on-surface"
              aria-hidden
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild className={appPrimaryButtonClassName}>
          <Link to="/signup">Get started</Link>
        </Button>
        <Button asChild className={appOutlineButtonClassName}>
          <Link to="/login">Already have an account?</Link>
        </Button>
      </div>
      <Link
        to="/pricing"
        className="mt-4 inline-block font-apex-body text-sm text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
      >
        View pricing
      </Link>
    </section>
  );
}
