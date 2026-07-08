import type { ReactNode } from "react";

type SettingsSectionChromeV2Props = {
  title: string;
  children: ReactNode;
  /** When true, children render without the inner card shell (e.g. account actions stacks). */
  bare?: boolean;
};

export function SettingsSectionChromeV2({
  title,
  children,
  bare = false,
}: SettingsSectionChromeV2Props) {
  return (
    <section className="v2-red-accent-border pl-6">
      <h2 className="mb-4 font-v2-headline text-[10px] uppercase tracking-[0.2em] text-v2-on-surface-variant">
        {title}
      </h2>
      {bare ? (
        children
      ) : (
        <div className="rounded-v2-lg bg-v2-surface-container-low p-6">
          {children}
        </div>
      )}
    </section>
  );
}
