import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { ApexLogo } from "@/components/ApexLogo";
import UserAvatar from "@/components/UserAvatar";
import CreateMenuV2 from "@/components/v2/CreateMenuV2";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

function getAccountDisplayName(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
): string {
  const raw = user.displayName?.trim();
  if (raw) return raw;
  return user.email?.trim() || "Driver";
}

export default function LeaderboardsTopBarV2() {
  const { user } = useAuth();
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  const profileTo = user ? "/v2/profile" : "/login";
  const profileName = user ? getAccountDisplayName(user) : "Sign in";

  return (
    <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-v2-outline-variant/15 bg-v2-background px-6">
      <Link
        to="/v2"
        className="group flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/70"
      >
        {logoImgFailed ? (
          <ApexLogo className="h-10 w-auto min-w-[80px] transition-transform group-hover:scale-[1.03]" />
        ) : (
          <img
            src="/logo.png?v=4"
            alt="Apex Logo"
            className="h-10 w-auto max-w-[112px] object-contain object-center transition-transform group-hover:scale-[1.03]"
            onError={() => setLogoImgFailed(true)}
          />
        )}
      </Link>

      <div className="flex items-center gap-4">
        <CreateMenuV2 />

        <button
          type="button"
          className="flex items-center justify-center text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          aria-label="Notifications"
        >
          <Bell className="size-6" aria-hidden />
        </button>

        <Link
          to={profileTo}
          className={cn(
            "overflow-hidden rounded-full border border-v2-outline-variant/30",
            !user && "opacity-80",
          )}
          aria-label={profileName}
        >
          <UserAvatar
            name={profileName}
            avatarUrl={user?.avatarUrl}
            size="sm"
            className="ring-0"
          />
        </Link>
      </div>
    </div>
  );
}
