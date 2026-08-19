import { useCallback, useMemo, useState, type ReactNode } from "react";
import "@/styles/theme.css";
import BetaWelcomeModal from "@/components/BetaWelcomeModal";
import BroadcastBanner from "@/components/BroadcastBanner";
import ProRequiredBanner from "@/components/ProRequiredBanner";
import { cn } from "@/lib/utils";
import AppFooter from "./AppFooter";
import MobileNavDrawer from "./MobileNavDrawer";
import { AppNavContext } from "./appNavContext";

export type AppLayoutProps = {
  children: ReactNode;
  topBar?: ReactNode;
  bottomBar?: ReactNode;
  className?: string;
  /** Show the desktop site footer (AppFooter, lg+ only). Default true. */
  showSiteFooter?: boolean;
};

export default function AppLayout({
  children,
  topBar,
  bottomBar,
  className,
  showSiteFooter = true,
}: AppLayoutProps) {
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
    <AppNavContext.Provider value={navContextValue}>
      <div
        className={cn(
          "apex-theme flex min-h-[100dvh] flex-col bg-apex-background text-apex-on-surface",
          className,
        )}
      >
        {topBar ? (
          <header
            className={cn(
              "z-50 shrink-0 bg-apex-background pt-[env(safe-area-inset-top)]",
              bottomBar ? "lg:sticky lg:top-0" : "sticky top-0",
            )}
          >
            {topBar}
          </header>
        ) : null}
        <ProRequiredBanner />
        <BroadcastBanner />
        <BetaWelcomeModal />
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-x-clip",
            bottomBar
              ? // Bottom bar is 4rem tall plus its safe-area padding; matches the mobile FAB offsets.
                "pb-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] lg:pb-0"
              : "pb-[env(safe-area-inset-bottom)]",
          )}
        >
          {children}
        </main>
        {bottomBar ? (
          <footer className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
            {bottomBar}
          </footer>
        ) : null}
        {bottomBar ? (
          <MobileNavDrawer open={mobileNavOpen} onClose={closeMobileNav} />
        ) : null}
        {showSiteFooter ? <AppFooter /> : null}
      </div>
    </AppNavContext.Provider>
  );
}
