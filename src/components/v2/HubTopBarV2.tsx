import { useState } from "react";
import { Link } from "react-router-dom";
import { ApexLogo } from "@/components/ApexLogo";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { V2_AUTH_PATHS } from "@/config/navigation";
import { NotificationsBellV2 } from "@/components/v2/NotificationsBellV2";
import { UserSearchTriggerV2 } from "@/components/v2/UserSearchTriggerV2";
import CreateMenuV2 from "@/components/v2/CreateMenuV2";
import HubTopBarNavLinksV2 from "@/components/v2/HubTopBarNavLinksV2";
import UserAccountMenuV2 from "@/components/v2/UserAccountMenuV2";

function getAccountDisplayName(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
): string {
  const raw = user.displayName?.trim();
  if (raw) return raw;
  return user.email?.trim() || "Driver";
}

export default function HubTopBarV2() {
  const { user } = useAuth();
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  const profileName = user ? getAccountDisplayName(user) : "Sign in";

  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-v2-outline-variant/15 bg-v2-background px-6">
      <div className="flex min-w-0 flex-1 items-center gap-8">
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
        <HubTopBarNavLinksV2 />
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {user ? (
          <>
            <UserSearchTriggerV2 />
            <NotificationsBellV2 />
            <CreateMenuV2 />
            <UserAccountMenuV2 />
          </>
        ) : (
          <Link
            to={V2_AUTH_PATHS.login}
            className="overflow-hidden rounded-full border border-v2-outline-variant/30 opacity-80"
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
