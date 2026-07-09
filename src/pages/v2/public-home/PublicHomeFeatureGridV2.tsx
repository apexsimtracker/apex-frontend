import { FEATURES } from "./publicHomeV2Shared";

export default function PublicHomeFeatureGridV2() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
          Everything in one hub
        </h2>
        <p className="mt-2 max-w-2xl font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Sign in for your activity feed, weekly goals, uploads, and
          personalized stats — or browse what&apos;s happening on the track
          today.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-5"
          >
            <div
              className="mb-3 flex size-9 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary"
              aria-hidden
            >
              <Icon className="size-4" />
            </div>
            <h3 className="font-v2-headline text-sm font-semibold text-v2-on-surface">
              {title}
            </h3>
            <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
