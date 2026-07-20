import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

const ADMIN_TITLE_BY_PREFIX: { prefix: string; title: string }[] = [
  { prefix: "/admin/users", title: "Users" },
  { prefix: "/admin/subscriptions", title: "Subscriptions" },
  { prefix: "/admin/sessions", title: "Sessions & laps" },
  { prefix: "/admin/tracks", title: "Tracks & catalogs" },
  { prefix: "/admin/challenges", title: "Challenges" },
  { prefix: "/admin/community", title: "Community" },
  { prefix: "/admin/leaderboards", title: "Leaderboards" },
  { prefix: "/admin/notifications", title: "Notifications" },
  { prefix: "/admin/follows", title: "Follow graph" },
  { prefix: "/admin/contact", title: "Contact inbox" },
  { prefix: "/admin/devices", title: "Agent releases" },
  { prefix: "/admin/email-auth", title: "Email & auth ops" },
  { prefix: "/admin/system", title: "System" },
  { prefix: "/admin", title: "Overview" },
];

function adminSectionTitle(pathname: string): string {
  for (const { prefix, title } of ADMIN_TITLE_BY_PREFIX) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title;
    }
  }
  return "Admin";
}

/**
 * Fixed top chrome for the admin shell. Height is locked to `h-16` so
 * AdminLayout offsets (`top-16`, `calc(100vh - 4rem)`, mobile `top-28`) stay aligned.
 */
export default function AdminHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const sectionTitle = adminSectionTitle(pathname);
  const displayName =
    user?.displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.trim() ||
    "Admin";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-white/10",
        "bg-background/95 backdrop-blur-md",
      )}
    >
      <div className="flex h-full w-full items-center gap-3 px-4 sm:px-6">
        <Link
          to="/admin"
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          <img
            src="/logo.png"
            alt=""
            className="size-8 rounded-md object-contain"
            width={32}
            height={32}
          />
          <span className="hidden min-w-0 sm:flex sm:flex-col sm:leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              {COMPANY_NAME}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="size-3 opacity-80" aria-hidden />
              Admin
            </span>
          </span>
        </Link>

        <div
          className="hidden h-6 w-px shrink-0 bg-white/10 sm:block"
          aria-hidden
        />

        <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground sm:text-foreground/90">
          <span className="sm:hidden">Admin · </span>
          {sectionTitle}
        </p>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 border-white/10 bg-secondary/40 text-foreground hover:bg-secondary/70"
          >
            <Link to="/">
              <ArrowLeft className="size-4 sm:mr-1.5" aria-hidden />
              <span className="hidden sm:inline">Back to app</span>
              <span className="sr-only sm:hidden">Back to app</span>
            </Link>
          </Button>

          {user ? (
            <div className="flex max-w-[10rem] items-center gap-2 rounded-lg border border-white/10 bg-secondary/30 py-1 pl-1 pr-2.5 sm:max-w-[14rem]">
              <UserAvatar
                name={displayName}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              <span className="hidden min-w-0 truncate text-xs font-medium text-foreground/90 sm:inline">
                {displayName}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
