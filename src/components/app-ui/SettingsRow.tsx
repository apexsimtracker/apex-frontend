import type { ReactNode } from "react";

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-apex-outline-variant/10 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-apex-headline text-sm font-bold text-apex-on-surface">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-apex-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
