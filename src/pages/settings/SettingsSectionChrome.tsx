import type { ReactNode } from "react";

type SettingsSectionChromeProps = {
  title: string;
  children: ReactNode;
  /** When true, children render without the inner card shell (e.g. account actions stacks). */
  bare?: boolean;
};

export function SettingsSectionChrome({
  title,
  children,
  bare = false,
}: SettingsSectionChromeProps) {
  return (
    <section className="apex-red-accent-border pl-6">
      <h2 className="mb-4 font-apex-headline text-[10px] uppercase tracking-[0.2em] text-apex-on-surface-variant">
        {title}
      </h2>
      {bare ? (
        children
      ) : (
        <div className="rounded-apex-lg bg-apex-surface-container-low p-6">
          {children}
        </div>
      )}
    </section>
  );
}
