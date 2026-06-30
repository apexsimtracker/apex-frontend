import type { ReactNode } from "react";
import "@/v2/v2-styles.css";
import { cn } from "@/lib/utils";

export type V2LayoutProps = {
  children: ReactNode;
  topBar?: ReactNode;
  bottomBar?: ReactNode;
  className?: string;
};

export default function V2Layout({
  children,
  topBar,
  bottomBar,
  className,
}: V2LayoutProps) {
  return (
    <div
      className={cn(
        "v2-theme flex min-h-[100dvh] flex-col bg-v2-background text-v2-on-surface",
        className,
      )}
    >
      {topBar ? (
        <header className="pt-[env(safe-area-inset-top)]">{topBar}</header>
      ) : null}
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-x-hidden",
          !bottomBar && "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        {children}
      </main>
      {bottomBar ? (
        <footer className="pb-[env(safe-area-inset-bottom)]">
          {bottomBar}
        </footer>
      ) : null}
    </div>
  );
}
