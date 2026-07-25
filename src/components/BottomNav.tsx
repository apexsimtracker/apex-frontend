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
      className="flex h-20 items-center justify-around rounded-t-lg border-t border-apex-outline-variant/15 bg-apex-surface-container-low/90 backdrop-blur-xl"
      aria-label="Primary navigation"
    >
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
              "flex flex-col items-center justify-center transition-transform",
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
        className={cn(
          "flex flex-col items-center justify-center transition-transform",
          menuOpen ? "scale-110 text-apex-primary" : "text-apex-on-surface-variant",
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
    </nav>
  );
}
