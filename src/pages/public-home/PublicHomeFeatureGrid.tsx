import { FEATURES } from "./publicHomeShared";

export default function PublicHomeFeatureGrid() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
          Everything in one hub
        </h2>
        <p className="mt-2 max-w-2xl font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
          Sign in for your activity feed, weekly goals, uploads, and
          personalized stats — or browse what&apos;s happening on the track
          today.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-5"
          >
            <div
              className="mb-3 flex size-9 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary"
              aria-hidden
            >
              <Icon className="size-4" />
            </div>
            <h3 className="font-apex-headline text-sm font-semibold text-apex-on-surface">
              {title}
            </h3>
            <p className="mt-2 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
