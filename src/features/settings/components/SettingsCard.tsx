import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsCard({
  title,
  description,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-white/10 bg-card/50 p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mb-4 text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </section>
  );
}
