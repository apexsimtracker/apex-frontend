import type { ReactNode } from "react";

/**
 * Single bordered card wrapping the profile hero row + key stats (matches pre-refactor layout).
 */
export function ProfileHeroCard({ children }: { children: ReactNode }) {
  return (
    <div className="border-white/6 mb-8 rounded-lg border bg-card/20 p-5 backdrop-blur-lg sm:mb-10 sm:p-8">
      {children}
    </div>
  );
}
