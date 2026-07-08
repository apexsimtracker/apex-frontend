import { NavLink, useLocation } from "react-router-dom";
import { BarChart2, Home, Menu, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useV2Nav } from "@/components/v2/v2NavContext";

type BottomNavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  isActiveOverride?: (pathname: string) => boolean;
};

const NAV_ITEMS: BottomNavItem[] = [
  { to: "/v2", label: "Home", icon: Home, end: true },
  { to: "/v2/leaderboards", label: "Leaderboards", icon: BarChart2 },
  { to: "/v2/challenges", label: "Challenges", icon: Trophy },
  { to: "/v2/community", label: "Community", icon: Users },
];

export default function V2BottomNavV2() {
  const { pathname } = useLocation();
  const v2Nav = useV2Nav();
  const menuOpen = v2Nav?.mobileNavOpen ?? false;

  return (
    <nav
      className="flex h-20 items-center justify-around rounded-t-lg border-t border-v2-outline-variant/15 bg-v2-surface-container-low/90 backdrop-blur-xl"
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
            className={cn(
              "flex flex-col items-center justify-center transition-transform",
              active
                ? "scale-110 text-v2-primary"
                : "text-v2-on-surface-variant",
            )}
          >
            <Icon className="size-6 shrink-0" aria-hidden />
            <span className="mt-1 font-v2-body text-[8px] font-semibold uppercase tracking-widest max-[390px]:text-[8px] min-[391px]:text-[10px]">
              {label}
            </span>
          </NavLink>
        );
      })}

      <button
        type="button"
        onClick={() => v2Nav?.setMobileNavOpen(true)}
        className={cn(
          "flex flex-col items-center justify-center transition-transform",
          menuOpen ? "scale-110 text-v2-primary" : "text-v2-on-surface-variant",
        )}
        aria-expanded={menuOpen}
        aria-controls="v2-mobile-nav-drawer"
        aria-label="Open menu"
      >
        <Menu className="size-6 shrink-0" aria-hidden />
        <span className="mt-1 font-v2-body text-[8px] font-semibold uppercase tracking-widest max-[390px]:text-[8px] min-[391px]:text-[10px]">
          Menu
        </span>
      </button>
    </nav>
  );
}
