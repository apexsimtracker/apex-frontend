import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  BarChart2,
  Bot,
  ChevronDown,
  HelpCircle,
  Home,
  Info,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  PenLine,
  Plus,
  Settings,
  Tag,
  Trophy,
  Upload,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import PlanPill from "@/components/PlanPill";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import {
  footerCompanyLinks,
  getAccountMenuItemsForUser,
  getFooterLegalLinks,
  getPrimaryNavItems,
  isNavPathActive,
  getLogSessionMenuItems,
  AUTH_PATHS,
  type AccountMenuItem,
  type FooterLinkItem,
  type LogSessionMenuIcon,
} from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { planTierForUser } from "@/features/billing/planPill";
import { usePlatform } from "@/hooks/usePlatform";
import { useSessionsNavActive } from "@/hooks/useSessionsNavActive";
import { prefetchNavIntent } from "@/lib/navIntentPrefetch";
import { useSignOut } from "@/lib/auth/useSignOut";
import { cn } from "@/lib/utils";

/** Header nav takes over at lg, where the drawer is unreachable — closing avoids a stuck scroll lock. */
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

/**
 * Unlike the shared modal overlay this scrim has no backdrop blur: blurring the whole page while
 * the panel slides drops frames on iOS, which is what made the drawer feel like it jumped.
 */
const drawerOverlayClassName =
  "fixed inset-0 z-[80] bg-apex-background/70 data-[state=closed]:animate-scrim-out";

type AppMobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const sectionLabelClassName =
  "px-3 pb-1 pt-3 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant/60";

const navRowClassName =
  "flex items-center gap-3 rounded-apex-sm px-3 py-2.5 font-apex-headline text-sm font-medium transition-colors";

function primaryNavIcon(to: string) {
  switch (to) {
    case "/":
      return Home;
    case "/leaderboards":
      return BarChart2;
    case "/challenges":
      return Trophy;
    case "/community":
      return Users;
    case "/pricing":
      return Tag;
    case "/sessions":
      return ListChecks;
    default:
      return Home;
  }
}

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

function companyIcon(to: string) {
  switch (to) {
    case "/about":
      return Info;
    case "/faq":
      return HelpCircle;
    case "/contact":
      return Mail;
    default:
      return Info;
  }
}

/**
 * Legal pages sit in a de-emphasised strip rather than full nav rows: the site footer is
 * desktop-only so the drawer is their only mobile entry point, but they are rarely the reason
 * anyone opens the menu.
 */
function DrawerLegalStrip({
  links,
  pathname,
  onNavigate,
}: {
  links: FooterLinkItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  if (links.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-x-1 gap-y-0.5 border-t border-apex-outline-variant/15 px-1 pt-2">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={cn(
            "rounded-apex-sm p-2 font-apex-body text-xs transition-colors",
            isNavPathActive(pathname, link.to)
              ? "text-apex-primary"
              : "text-apex-on-surface-variant/70 hover:bg-apex-surface-container hover:text-apex-on-surface",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
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
  const [entered, setEntered] = useState(false);

  const primaryItems = getPrimaryNavItems(Boolean(user));
  const accountItems = user
    ? getAccountMenuItemsForUser(user.role === "ADMIN", isNative)
    : [];
  const createItems = getLogSessionMenuItems(isNative);
  const accountName =
    user?.displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.trim() ||
    "Account";

  const onIntent = (to: string) => {
    prefetchNavIntent(to, queryClient, { userId: user?.id });
  };

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  /**
   * Opening mounts the panel, installs the focus trap and locks page scroll in a single commit.
   * CSS animations run on a clock rather than per frame, so on iOS that long blocked frame burned
   * most of the slide before anything painted and the panel appeared to jump into place. Waiting two
   * frames means the animation starts only once the browser can actually paint it. Closing is
   * already smooth — nothing mounts — so it stays driven by `data-state`.
   */
  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    if (media.matches) {
      onClose();
      return;
    }
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [open, onClose]);

  const slideIn = open && entered;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {/*
        The theme class goes on the overlay and panel themselves, not a wrapper: DialogPortal wraps
        each child in its own Presence, and a wrapper with no animation unmounts the subtree
        immediately, cutting off the panel's exit animation.
      */}
      <DialogPortal>
        <DialogPrimitive.Overlay
          className={cn(
            "apex-theme",
            drawerOverlayClassName,
            slideIn ? "animate-scrim-in opacity-100" : "opacity-0",
          )}
        />
        <DialogPrimitive.Content
          id="mobile-nav-drawer"
          aria-describedby={undefined}
          className={cn(
            "apex-theme fixed inset-y-0 left-0 z-[80] flex w-[min(20rem,86vw)] flex-col border-r border-apex-outline-variant/15 bg-apex-surface-container-low text-apex-on-surface shadow-[8px_0_24px_rgba(0,0,0,0.35)] outline-none",
            "pt-[env(safe-area-inset-top)] will-change-transform",
            // Driven by `open` rather than the entered flag so the exit animation is in place in the
            // same commit as data-state=closed — Radix unmounts immediately otherwise.
            "data-[state=closed]:animate-drawer-out",
            slideIn ? "translate-x-0 animate-drawer-in" : "-translate-x-full",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Menu
          </DialogPrimitive.Title>

          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-apex-outline-variant/15 p-3">
            {user ? (
              <Link
                to="/profile"
                onPointerEnter={() => onIntent("/profile")}
                onFocus={() => onIntent("/profile")}
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-apex-sm p-1 transition-colors hover:bg-apex-surface-container"
              >
                <UserAvatar
                  name={accountName}
                  avatarUrl={user.avatarUrl}
                  size="sm"
                  className="ring-0"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-apex-headline text-sm font-semibold text-apex-on-surface">
                    {accountName}
                  </span>
                  <span className="mt-0.5 flex">
                    <PlanPill tier={planTierForUser(user)} />
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                to="/"
                onClick={onClose}
                className="flex min-w-0 items-center rounded-apex-sm px-1"
                aria-label="Apex home"
              >
                <img
                  src="/logo.png?v=5"
                  alt="Apex"
                  width={36}
                  height={36}
                  className="h-9 w-auto max-w-[100px] object-contain"
                />
              </Link>
            )}

            <DialogPrimitive.Close
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-apex-sm text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface focus:outline-none focus:ring-2 focus:ring-apex-primary/70 focus:ring-offset-2 focus:ring-offset-apex-surface-container-low"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-6 pt-1">
              <p className={sectionLabelClassName}>Explore</p>
              {primaryItems.map((item) => {
                const Icon = primaryNavIcon(item.to);
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
                      navRowClassName,
                      active
                        ? "bg-apex-primary/15 text-apex-primary"
                        : "text-apex-on-surface-variant hover:bg-apex-surface-container hover:text-apex-on-surface",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}

              {loading ? (
                <div className="mt-3 h-24 animate-pulse rounded-apex-lg bg-apex-surface-container" />
              ) : user ? (
                <>
                  <div className="mt-2 border-t border-apex-outline-variant/15 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(!isCreateOpen)}
                      className={cn(
                        navRowClassName,
                        "w-full justify-between text-apex-on-surface hover:bg-apex-surface-container",
                      )}
                      aria-expanded={isCreateOpen}
                    >
                      <span className="flex items-center gap-3">
                        <Plus className="size-4 shrink-0" aria-hidden />
                        Create
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 transition-transform",
                          isCreateOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>
                    {isCreateOpen ? (
                      <div className="ml-3 space-y-0.5 border-l border-apex-outline-variant/15 pl-2">
                        {createItems.map((item) => {
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
                              className="flex items-center gap-2 rounded-apex-sm px-3 py-2 text-sm text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
                            >
                              <Icon className="size-4 shrink-0" aria-hidden />
                              <span className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="truncate">{item.title}</span>
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

                  <div className="mt-2 border-t border-apex-outline-variant/15 pt-1">
                    <p className={sectionLabelClassName}>Account</p>
                    {accountItems.map((item) => {
                      const Icon = accountIcon(item);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onPointerEnter={() => onIntent(item.to)}
                          onPointerDown={() => onIntent(item.to)}
                          onFocus={() => onIntent(item.to)}
                          onClick={onClose}
                          className={cn(
                            navRowClassName,
                            isNavPathActive(location.pathname, item.to)
                              ? "bg-apex-primary/15 text-apex-primary"
                              : "text-apex-on-surface-variant hover:bg-apex-surface-container hover:text-apex-on-surface",
                          )}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : null}

              <div className="mt-2 border-t border-apex-outline-variant/15 pt-1">
                <p className={sectionLabelClassName}>Company</p>
                {footerCompanyLinks.map((link) => {
                  const Icon = companyIcon(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={onClose}
                      className={cn(
                        navRowClassName,
                        isNavPathActive(location.pathname, link.to)
                          ? "bg-apex-primary/15 text-apex-primary"
                          : "text-apex-on-surface-variant hover:bg-apex-surface-container hover:text-apex-on-surface",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {link.label}
                    </Link>
                  );
                })}

                <DrawerLegalStrip
                  links={getFooterLegalLinks(isNative)}
                  pathname={location.pathname}
                  onNavigate={onClose}
                />
              </div>
            </nav>

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-apex-surface-container-low to-transparent"
              aria-hidden
            />
          </div>

          <div className="shrink-0 border-t border-apex-outline-variant/15 px-3 pb-[max(1rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] pt-3">
            {loading ? (
              <div className="h-9 animate-pulse rounded-apex-sm bg-apex-surface-container" />
            ) : user ? (
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => {
                  onClose();
                  void signOut();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-apex-sm px-4 py-2.5 text-sm font-medium text-[#ff6e84] transition-colors hover:bg-[#a70138]/20 disabled:opacity-50"
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 border-apex-outline-variant/30"
                >
                  <Link to={AUTH_PATHS.login} onClick={onClose}>
                    Sign in
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="flex-1 bg-apex-primary font-apex-headline font-bold uppercase tracking-widest hover:bg-apex-primary/90"
                >
                  <Link to={AUTH_PATHS.signup} onClick={onClose}>
                    Get started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
