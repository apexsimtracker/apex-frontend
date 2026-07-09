import { cn } from "@/lib/utils";
import {
  cardClassName,
  FEATURES,
  sectionEyebrowClassName,
} from "./publicHomeV2Shared";
import { IconChip } from "./PublicHomeIconChipV2";

export default function PublicHomeFeatureGridV2() {
  return (
    <section className="relative space-y-4">
      <div className="text-center">
        <h2 className={sectionEyebrowClassName}>Everything in one hub</h2>
        <p className="mx-auto mt-3 max-w-2xl font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Sign in for your activity feed, weekly goals, uploads, and
          personalized stats — or browse what&apos;s happening on the track
          today.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description, featured }) => (
          <section
            key={title}
            className={cn(
              cardClassName,
              "transition-colors hover:border-v2-primary/30",
              featured &&
                "sm:col-span-2 sm:flex sm:items-start sm:gap-5 lg:col-span-3",
            )}
          >
            <IconChip className={cn("mb-3 shrink-0", featured && "sm:mb-0")}>
              <Icon className="size-5" />
            </IconChip>
            <div className={cn(featured && "sm:min-w-0 sm:flex-1")}>
              <h3 className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                {title}
              </h3>
              <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                {description}
              </p>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
