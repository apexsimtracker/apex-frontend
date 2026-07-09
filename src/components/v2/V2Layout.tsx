import { useCallback, useMemo, useState, type ReactNode } from "react";
import "@/v2/v2-styles.css";
import { cn } from "@/lib/utils";
import V2AppFooter from "./V2AppFooter";
import V2MobileNavDrawer from "./V2MobileNavDrawer";
import { V2NavContext } from "./v2NavContext";

export type V2LayoutProps = {
  children: ReactNode;
  topBar?: ReactNode;
  bottomBar?: ReactNode;
  className?: string;
  /** Show the desktop site footer (V2AppFooter, lg+ only). Default true. */
  showSiteFooter?: boolean;
};

export default function V2Layout({
  children,
  topBar,
  bottomBar,
  className,
  showSiteFooter = true,
}: V2LayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const navContextValue = useMemo(
    () => ({
      mobileNavOpen,
      setMobileNavOpen,
    }),
    [mobileNavOpen],
  );

  return (
    <V2NavContext.Provider value={navContextValue}>
      <div
        className={cn(
          "v2-theme flex min-h-[100dvh] flex-col bg-v2-background text-v2-on-surface",
          className,
        )}
      >
        {topBar ? (
          <header
            className={cn(
              "z-50 shrink-0 bg-v2-background pt-[env(safe-area-inset-top)]",
              bottomBar ? "lg:sticky lg:top-0" : "sticky top-0",
            )}
          >
            {topBar}
          </header>
        ) : null}
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-x-hidden",
            bottomBar ? "pb-24 lg:pb-0" : "pb-[env(safe-area-inset-bottom)]",
          )}
        >
          {children}
        </main>
        {bottomBar ? (
          <footer className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] lg:hidden">
            {bottomBar}
          </footer>
        ) : null}
        {bottomBar ? (
          <V2MobileNavDrawer open={mobileNavOpen} onClose={closeMobileNav} />
        ) : null}
        {showSiteFooter ? <V2AppFooter /> : null}
      </div>
    </V2NavContext.Provider>
  );
}
