import { SIMS } from "./publicHomeShared";

export default function PublicHomeSimsSection() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
          One place for every sim
        </h2>
        <p className="mt-2 max-w-xl font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
          Compare progress across the titles you already run — consistent data,
          not siloed sheets.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {SIMS.map((name) => (
          <li
            key={name}
            className="rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container px-3 py-1.5 font-apex-headline text-sm text-apex-on-surface"
          >
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
