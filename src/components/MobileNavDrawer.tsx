import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  ChevronDown,
  LayoutDashboard,
  PenLine,
  Plus,
  Settings,
  Trophy,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import PlanPill from "@/components/PlanPill";
import { getAccountMenuItemsForUser, getPrimaryNavItems, isNavPathActive, logSessionMenuItems, AUTH_PATHS, type AccountMenuItem, type LogSessionMenuIcon } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { planTierForUser } from "@/features/billing/planPill";
import { usePlatform } from "@/hooks/usePlatform";
import { useSessionsNavActive } from "@/hooks/useSessionsNavActive";
import { prefetchNavIntent } from "@/lib/navIntentPrefetch";
import { useSignOut } from "@/lib/auth/useSignOut";
import { cn } from "@/lib/utils";

type AppMobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function accountIcon(item: AccountMenuItem) {
  switch (item.to) {
    case "/profile":
      return User;
    case "/personal-bests":
      return Trophy;
    case "/settings":
      return Settings;
    case "/agent":
      return Bot;
    case "/admin":
      return LayoutDashboard;
    default:
      return User;
  }
}

function createMenuIcon(icon: LogSessionMenuIcon) {
  switch (icon) {
    case "agent":
      return Zap;
    case "manual":
      return PenLine;
    case "upload":
      return Upload;
  }
}

export default function MobileNavDrawer({
  open,
  onClose,
}: AppMobileNavDrawerProps) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { isNative } = usePlatform();
  const { signOut, isSigningOut } = useSignOut();
  const sessionsNavActive = useSessionsNavActive();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const primaryItems = getPrimaryNavItems(Boolean(user));
  const accountItems = user
    ? getAccountMenuItemsForUser(user.role === "ADMIN", isNative)
    : [];

  const onIntent = (to: string) => {
    prefetchNavIntent(to, queryClient, { userId: user?.id });
  };

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-16 z-[60] bg-black/60 lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="mobile-nav-drawer"
        aria-hidden={!open}
        className={cn(
          "fixed left-0 top-16 z-[70] flex h-[calc(100dvh-4rem)] w-[min(18rem,88vw)] flex-col border-r border-apex-outline-variant/15 bg-apex-surface-container-low shadow-[8px_0_24px_rgba(0,0,0,0.35)] transition-[transform] duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-apex-outline-variant/15 p-3">
          <span className="font-apex-headline text-sm font-bold uppercase tracking-widest text-apex-on-surface-variant">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-apex-sm text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
            aria-label="Close menu"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          {primaryItems.map((item) => {
            const active =
              item.to === "/sessions"
                ? sessionsNavActive
                : isNavPathActive(location.pathname, item.to, item.end);
            return (
              <Link
                key={item.to}
                to={item.to}
                onPointerEnter={() => onIntent(item.to)}
                onPointerDown={() => onIntent(item.to)}
                onFocus={() => onIntent(item.to)}
                onClick={onClose}
                className={cn(
                  "rounded-apex-sm px-4 py-2.5 font-apex-headline text-sm font-medium transition-colors",
                  active
                    ? "bg-apex-primary/15 text-apex-primary"
                    : "text-apex-on-surface-variant hover:bg-apex-surface-container hover:text-apex-on-surface",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {loading ? (
            <div className="mt-4 border-t border-apex-outline-variant/15 pt-4">
              <div className="h-20 animate-pulse rounded-apex-lg bg-apex-surface-container" />
            </div>
          ) : user ? (
            <>
              <div className="mt-4 border-t border-apex-outline-variant/15 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(!isCreateOpen)}
                  className="flex w-full items-center justify-between rounded-apex-sm px-4 py-2.5 font-apex-headline text-sm font-medium text-apex-on-surface transition-colors hover:bg-apex-surface-container"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="size-4" aria-hidden />
                    Create
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      isCreateOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {isCreateOpen ? (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {logSessionMenuItems.map((item) => {
                      const Icon = createMenuIcon(item.icon);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onPointerEnter={() => onIntent(item.to)}
                          onPointerDown={() => onIntent(item.to)}
                          onFocus={() => onIntent(item.to)}
                          onClick={() => {
                            onClose();
                            setIsCreateOpen(false);
                          }}
                          className="flex items-center gap-2 rounded-apex-sm px-4 py-2 text-sm text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            <span>{item.title}</span>
                            {item.proBadge ? (
                              <span className="rounded-[2px] bg-[#E10600] px-1 py-px text-[6px] font-bold uppercase tracking-wider text-white">
                                Pro
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 border-t border-apex-outline-variant/15 pt-3">
                <div className="flex items-center justify-between gap-2 px-4 py-1">
                  <p className="font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant/60">
                    Account
                  </p>
                  <PlanPill tier={planTierForUser(user)} />
                </div>
                {accountItems.map((item) => {
                  const Icon = accountIcon(item);
                  const to = item.to;
                  return (
                    <Link
                      key={item.to}
                      to={to}
                      onPointerEnter={() => onIntent(to)}
                      onPointerDown={() => onIntent(to)}
                      onFocus={() => onIntent(to)}
                      onClick={onClose}
                      className="flex items-center gap-2 rounded-apex-sm px-4 py-2.5 text-sm font-medium text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => {
                    onClose();
                    void signOut();
                  }}
                  className="mt-1 w-full rounded-apex-sm px-4 py-2.5 text-left text-sm font-medium text-[#ff6e84] transition-colors hover:bg-[#a70138]/20 disabled:opacity-50"
                >
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-col gap-2 border-t border-apex-outline-variant/15 px-1 pt-4">
              <Link
                to={AUTH_PATHS.login}
                onClick={onClose}
                className="rounded-apex-sm px-4 py-2.5 text-center text-sm font-medium text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
              >
                Sign in
              </Link>
              <Link
                to={AUTH_PATHS.signup}
                onClick={onClose}
                className={cn(
                  "rounded-apex-sm bg-apex-primary px-4 py-2.5 text-center font-apex-headline text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-apex-primary/90",
                )}
              >
                Get started
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
