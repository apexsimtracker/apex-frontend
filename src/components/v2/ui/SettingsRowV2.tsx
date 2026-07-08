import type { ReactNode } from "react";

export function SettingsRowV2({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-v2-outline-variant/10 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-v2-headline text-sm font-bold text-v2-on-surface">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-v2-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
