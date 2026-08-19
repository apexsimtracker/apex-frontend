import { SkeletonBlock } from "@/components/ui/skeleton";
import ProfileSkeleton from "@/pages/profile/ProfileSkeleton";
import SessionDetailSkeleton from "@/pages/session/SessionDetailSkeleton";
import { PricingPageSkeleton } from "@/pages/pricing/PricingPageSkeleton";
import PersonalBestsSkeleton from "@/pages/personal-bests/PersonalBestsSkeleton";
import ManualActivityFormSkeleton from "@/pages/manual/ManualActivityFormSkeleton";
import { cn } from "@/lib/utils";

/** Matches product pages: Profile, Sessions, Pricing, etc. */
const PRODUCT_SHELL =
  "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8";

const sk = "bg-apex-surface-container-high/80";

function PageTitleSkeleton({
  titleWidth = 200,
  subtitleWidth = 300,
  className,
}: {
  titleWidth?: number;
  subtitleWidth?: number;
  /** Match the page's content column so the header does not shift on load. */
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <SkeletonBlock
        height={32}
        width={titleWidth}
        className={sk}
        rounded="sm"
      />
      <SkeletonBlock
        height={14}
        width={subtitleWidth}
        className={sk}
        rounded="sm"
      />
    </div>
  );
}

export function ProfileRouteSkeleton({
  showBackLink = false,
}: {
  showBackLink?: boolean;
}) {
  return (
    <div className={PRODUCT_SHELL} aria-busy="true" aria-label="Loading">
      <ProfileSkeleton showBackLink={showBackLink} />
    </div>
  );
}

export function SessionDetailRouteSkeleton() {
  return (
    <div
      className={cn(PRODUCT_SHELL, "space-y-4")}
      aria-busy="true"
      aria-label="Loading"
    >
      <SessionDetailSkeleton />
    </div>
  );
}

export function PricingRouteSkeleton() {
  return (
    <div className={PRODUCT_SHELL} aria-busy="true" aria-label="Loading">
      <div className="mb-10">
        <PageTitleSkeleton titleWidth={220} subtitleWidth={340} />
      </div>
      <PricingPageSkeleton />
    </div>
  );
}

export function PersonalBestsRouteSkeleton() {
  return (
    <div
      className={cn(PRODUCT_SHELL, "space-y-6")}
      aria-busy="true"
      aria-label="Loading"
    >
      <PageTitleSkeleton titleWidth={200} subtitleWidth={360} />
      <PersonalBestsSkeleton contentOnly />
    </div>
  );
}

export function ManualActivityRouteSkeleton() {
  return (
    <div
      className={cn(PRODUCT_SHELL, "space-y-8")}
      aria-busy="true"
      aria-label="Loading"
    >
      <PageTitleSkeleton
        titleWidth={180}
        subtitleWidth={380}
        className="mx-auto w-full max-w-4xl"
      />
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <ManualActivityFormSkeleton />
      </div>
    </div>
  );
}

export function UploadRouteSkeleton() {
  return (
    <div
      className={cn(PRODUCT_SHELL, "space-y-8")}
      aria-busy="true"
      aria-label="Loading"
    >
      <PageTitleSkeleton
        titleWidth={200}
        subtitleWidth={400}
        className="mx-auto w-full max-w-2xl"
      />
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-apex-outline-variant/25 bg-apex-surface-container-low p-8">
          <SkeletonBlock
            height={40}
            width={40}
            rounded="full"
            className={sk}
          />
          <SkeletonBlock height={14} width="60%" className={sk} rounded="sm" />
          <SkeletonBlock height={12} width="40%" className={sk} rounded="sm" />
          <SkeletonBlock
            height={40}
            width={140}
            className={cn("mt-2", sk)}
            rounded="sm"
          />
        </div>
      </div>
    </div>
  );
}
