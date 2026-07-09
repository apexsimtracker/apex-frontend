import { Link } from "react-router-dom";
import { ChevronRight, Flag } from "lucide-react";
import { cardClassName } from "./publicHomeV2Shared";
import { IconChip } from "./PublicHomeIconChipV2";

export default function PublicHomeFounderSectionV2() {
  return (
    <section className={cardClassName}>
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <IconChip className="mb-0 size-12 shrink-0">
          <Flag className="size-6" />
        </IconChip>
        <div className="flex-1">
          <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
            Built by a racer
          </h2>
          <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            Founded by Hugo Cook — British GT with Barwell Motorsport. Apex
            exists because sim prep deserved the same seriousness as real-world
            racing.
          </p>
          <Link
            to="/v2/about"
            className="mt-3 inline-flex items-center gap-1 font-v2-body text-sm font-medium text-v2-primary transition-colors hover:text-v2-primary/80"
          >
            Our story
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
