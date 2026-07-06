import { NavLink, useLocation } from "react-router-dom";
import { BarChart2, Home, Trophy, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
  {
    to: "/v2/profile",
    label: "Profile",
    icon: User,
    isActiveOverride: (pathname) =>
      pathname === "/v2/profile" || pathname === "/v2/settings",
  },
];

export default function SettingsBottomNavV2() {
  const { pathname } = useLocation();

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
            <span className="mt-1 font-v2-body text-[10px] font-semibold uppercase tracking-widest">
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
