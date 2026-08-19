import { NavLink, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart2, Home, Menu, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppNav } from "@/components/appNavContext";
import { useAuth } from "@/contexts/AuthContext";
import { prefetchNavIntent } from "@/lib/navIntentPrefetch";

type BottomNavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  isActiveOverride?: (pathname: string) => boolean;
};

const NAV_ITEMS: BottomNavItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/leaderboards", label: "Leaderboards", icon: BarChart2 },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/community", label: "Community", icon: Users },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const appNav = useAppNav();
  const menuOpen = appNav?.mobileNavOpen ?? false;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const onIntent = (to: string) => {
    prefetchNavIntent(to, queryClient, { userId: user?.id });
  };

  return (
    <nav
      // Safe-area padding lives inside the bar so its surface reaches the physical bottom edge
      // (no strip of scrolling content under it), while icons stay clear of the home indicator.
      //
      // Opaque on purpose: at 90% the page's white text ghosted through, and a translucent bar also
      // forced a full-width backdrop blur that stalled the drawer animation on iOS.
      className="rounded-t-lg border-t border-apex-outline-variant/15 bg-apex-surface-container-low pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Primary navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, isActiveOverride }) => {
          const active = isActiveOverride
            ? isActiveOverride(pathname)
            : end
              ? pathname === to
              : pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onPointerEnter={() => onIntent(to)}
              onPointerDown={() => onIntent(to)}
              onFocus={() => onIntent(to)}
              className={cn(
                "flex touch-manipulation flex-col items-center justify-center transition-transform",
                active
                  ? "scale-110 text-apex-primary"
                  : "text-apex-on-surface-variant",
              )}
            >
              <Icon className="size-6 shrink-0" aria-hidden />
              <span className="mt-1 font-apex-body text-[8px] font-semibold uppercase tracking-widest max-[390px]:text-[8px] min-[391px]:text-[10px]">
                {label}
              </span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => appNav?.setMobileNavOpen(true)}
          // touch-manipulation drops WebKit's double-tap-zoom wait before the click fires.
          className={cn(
            "flex touch-manipulation flex-col items-center justify-center transition-transform",
            menuOpen
              ? "scale-110 text-apex-primary"
              : "text-apex-on-surface-variant",
          )}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-drawer"
          aria-label="Open menu"
        >
          <Menu className="size-6 shrink-0" aria-hidden />
          <span className="mt-1 font-apex-body text-[8px] font-semibold uppercase tracking-widest max-[390px]:text-[8px] min-[391px]:text-[10px]">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
