import { SIMS } from "./publicHomeV2Shared";

export default function PublicHomeSimsSectionV2() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
          One place for every sim
        </h2>
        <p className="mt-2 max-w-xl font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Compare progress across the titles you already run — consistent data,
          not siloed sheets.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {SIMS.map((name) => (
          <li
            key={name}
            className="rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container px-3 py-1.5 font-v2-headline text-sm text-v2-on-surface"
          >
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
