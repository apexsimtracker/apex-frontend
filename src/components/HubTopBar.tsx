import { useState } from "react";
import { Link } from "react-router-dom";
import { ApexLogo } from "@/components/ApexLogo";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_PATHS } from "@/config/navigation";
import { NotificationsBell } from "@/components/NotificationsBell";
import { UserSearchTrigger } from "@/components/UserSearchTrigger";
import CreateMenu from "@/components/CreateMenu";
import HubTopBarNavLinks from "@/components/HubTopBarNavLinks";
import UserAccountMenu from "@/components/UserAccountMenu";

function getAccountDisplayName(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
): string {
  const raw = user.displayName?.trim();
  if (raw) return raw;
  return user.email?.trim() || "Driver";
}

export default function HubTopBar() {
  const { user } = useAuth();
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  const profileName = user ? getAccountDisplayName(user) : "Sign in";

  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-apex-outline-variant/15 bg-apex-background px-6">
      <div className="flex min-w-0 flex-1 items-center gap-8">
        <Link
          to="/"
          className="group flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/70"
        >
          {logoImgFailed ? (
            <ApexLogo className="h-10 w-auto min-w-[80px] transition-transform group-hover:scale-[1.03]" />
          ) : (
            <img
              src="/logo.png?v=5"
              alt="Apex Logo"
              className="h-10 w-auto max-w-[112px] object-contain object-center transition-transform group-hover:scale-[1.03]"
              onError={() => setLogoImgFailed(true)}
            />
          )}
        </Link>
        <HubTopBarNavLinks />
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {user ? (
          <>
            <UserSearchTrigger />
            <NotificationsBell />
            <CreateMenu />
            <UserAccountMenu />
          </>
        ) : (
          <Link
            to={AUTH_PATHS.login}
            className="overflow-hidden rounded-full border border-apex-outline-variant/30 opacity-80"
            aria-label={profileName}
          >
            <UserAvatar
              name={profileName}
              avatarUrl={undefined}
              size="sm"
              className="ring-0"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
