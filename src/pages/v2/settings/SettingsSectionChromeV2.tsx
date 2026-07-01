import type { ReactNode } from "react";

type SettingsSectionChromeV2Props = {
  title: string;
  children: ReactNode;
};

export function SettingsSectionChromeV2({
  title,
  children,
}: SettingsSectionChromeV2Props) {
  return (
    <section className="v2-red-accent-border pl-6">
      <h2 className="mb-4 font-v2-headline text-[10px] uppercase tracking-[0.2em] text-v2-on-surface-variant">
        {title}
      </h2>
      <div className="v2-kinetic-glass rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-6">
        {children}
      </div>
    </section>
  );
}
