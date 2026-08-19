import { useState } from "react";
import { Link } from "react-router-dom";
import { ApexLogo } from "@/components/ApexLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_PATHS } from "@/config/navigation";
import { NotificationsBell } from "@/components/NotificationsBell";
import { UserSearchTrigger } from "@/components/UserSearchTrigger";
import CreateMenu from "@/components/CreateMenu";
import HubTopBarNavLinks from "@/components/HubTopBarNavLinks";
import UserAccountMenu from "@/components/UserAccountMenu";

export default function HubTopBar() {
  const { user } = useAuth();
  const [logoImgFailed, setLogoImgFailed] = useState(false);

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
              // Intrinsic size of the asset, so the box is reserved before the
              // image decodes and the nav links never shift.
              width={40}
              height={40}
              fetchPriority="high"
              decoding="sync"
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
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-apex-outline-variant/30"
            >
              <Link to={AUTH_PATHS.login}>Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden bg-apex-primary font-apex-headline font-bold uppercase tracking-widest hover:bg-apex-primary/90 sm:inline-flex"
            >
              <Link to={AUTH_PATHS.signup}>Get started</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
