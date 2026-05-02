import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

function useIsLargeScreen(): boolean {
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isLg;
}
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Car,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  Mail,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Trophy,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "apex_admin_sidebar_collapsed";

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // ignore
  }
}

type NavItem = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
  end?: boolean;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [{ key: "overview", label: "Overview", icon: LayoutDashboard, to: "/admin", end: true }],
  },
  {
    title: "Management",
    items: [
      { key: "users", label: "Users", icon: Users, to: "/admin/users" },
      { key: "sessions", label: "Sessions & laps", icon: Activity, to: "/admin/sessions" },
      { key: "tracks", label: "Tracks & catalogs", icon: Car, to: "/admin/tracks" },
      { key: "challenges", label: "Challenges", icon: Trophy, to: "/admin/challenges" },
      { key: "community", label: "Community & discussions", icon: MessageSquare, to: "/admin/community" },
      { key: "leaderboards", label: "Leaderboards", icon: ListOrdered, to: "/admin/leaderboards" },
      { key: "notifications", label: "Notifications", icon: Bell, to: "/admin/notifications" },
      { key: "follows", label: "Follow graph", icon: UserCog, to: "/admin/follows" },
      { key: "billing", label: "Billing & Pro", icon: CreditCard, to: "/admin/billing" },
      { key: "waitlist", label: "Pro waitlist", icon: BookOpen, to: "/admin/waitlist" },
      { key: "devices", label: "Devices & agent", icon: Server, to: "/admin/devices" },
      { key: "email-auth", label: "Email & auth ops", icon: Mail, to: "/admin/email-auth" },
      { key: "system", label: "System", icon: BarChart3, to: "/admin/system" },
    ],
  },
];

function NavItemLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "transition-colors",
      collapsed
        ? cn(
            /* Grid + place-items: reliable vertical/horizontal center for icon-only (avoids text line-height / baseline shift) */
            "mx-auto grid size-10 shrink-0 place-items-center rounded-lg p-0 leading-none",
            isActive
              ? "bg-secondary/80 text-white shadow-sm"
              : "text-foreground/75 hover:bg-secondary/70 hover:text-foreground"
          )
        : cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            isActive ? "bg-secondary/80 text-white" : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
          )
    );

  const inner = (
    <>
      <Icon
        className={cn(
          "shrink-0 opacity-90",
          collapsed ? "size-[1.125rem] block" : "size-4"
        )}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <NavLink
            to={item.to}
            end={item.end}
            className={linkClass}
            aria-label={item.label}
          >
            {inner}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[14rem]">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <NavLink to={item.to} end={item.end} className={linkClass}>
      {inner}
    </NavLink>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const isLg = useIsLargeScreen();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [mobileOpen, setMobileOpen] = useState(false);
  /** Icon-only rail only on large screens; mobile drawer always shows labels. */
  const navCollapsed = collapsed && isLg;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      writeCollapsedPreference(next);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-white/10 bg-background">
      {/* Mobile: open menu control */}
      <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-white/10 bg-background/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 bg-secondary/40 text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          aria-expanded={mobileOpen}
          aria-controls="admin-sidebar"
        >
          <Menu className="size-5" aria-hidden />
          <span className="sr-only">Open admin menu</span>
        </button>
        <span className="text-sm font-medium text-muted-foreground">Admin menu</span>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/60 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar: fixed below header (lg+) so it does not scroll with the dashboard; mobile drawer unchanged */}
      <aside
        id="admin-sidebar"
        className={cn(
          "fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-[min(18rem,88vw)] flex-col border-r border-white/10 bg-[hsl(var(--background))] shadow-[8px_0_24px_rgba(0,0,0,0.35)] transition-[transform,width] duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:z-30 lg:translate-x-0 lg:shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
          navCollapsed ? "lg:w-16" : "lg:w-60"
        )}
      >
        <div className="flex shrink-0 items-center justify-end gap-1 border-b border-white/10 px-2 py-2 lg:border-b-0 lg:px-1 lg:pt-2">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mr-auto inline-flex size-10 items-center justify-center rounded-lg text-foreground/80 hover:bg-secondary/60 lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "hidden size-10 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-secondary/60 lg:inline-flex",
              navCollapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" aria-hidden />
            ) : (
              <PanelLeftClose className="size-5" aria-hidden />
            )}
          </button>
        </div>

        <nav
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6 pt-2 lg:py-0",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            navCollapsed ? "lg:px-1.5" : "lg:px-3"
          )}
        >
          {navGroups.map((group) => (
            <div key={group.title}>
              <p
                className={cn(
                  "mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  navCollapsed && "lg:sr-only"
                )}
              >
                {group.title}
              </p>
              <ul
                className={cn(
                  "space-y-0.5",
                  navCollapsed && "lg:space-y-1.5"
                )}
              >
                {group.items.map((item) => (
                  <li
                    key={item.key}
                    className={cn(navCollapsed && "lg:flex lg:justify-center")}
                  >
                    <NavItemLink item={item} collapsed={navCollapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:max-h-[calc(100vh-4rem)] lg:pr-10",
          "transition-[padding] duration-200 ease-out",
          /* sidebar width (w-60 | w-16) + lg horizontal padding (px-10 → 2.5rem) */
          navCollapsed ? "lg:pl-[6.5rem]" : "lg:pl-[17.5rem]"
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}
