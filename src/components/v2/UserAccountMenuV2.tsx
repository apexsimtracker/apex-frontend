import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Trophy,
  User,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/hooks/usePlatform";
import {
  getAccountMenuItemsForUser,
  toV2AccountPath,
  type AccountMenuItem,
} from "@/config/navigation";
import { prefetchOwnProfileQueries } from "@/lib/profileQueryKeys";
import { useSignOut } from "@/lib/auth/useSignOut";
import type { AuthUser } from "@/lib/api";
import {
  v2DropdownDangerItemClassName,
  v2DropdownEmailClassName,
  v2DropdownItemClassName,
  v2DropdownSeparatorClassName,
  v2ProfileDropdownContentClassName,
} from "@/components/v2/ui/v2ButtonClasses";

function menuIcon(item: AccountMenuItem) {
  switch (item.to) {
    case "/profile":
      return User;
    case "/personal-bests":
      return Trophy;
    case "/settings":
      return Settings;
    case "/agent":
      return Bot;
    case "/admin":
      return LayoutDashboard;
    default:
      return User;
  }
}

function displayNameForUser(user: AuthUser): string {
  return (
    user.displayName?.trim() ||
    user.name?.trim() ||
    user.email?.trim() ||
    "Account"
  );
}

export default function UserAccountMenuV2() {
  const { user } = useAuth();
  const { isNative } = usePlatform();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut, isSigningOut } = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);

  const prefetchOwnProfile = useCallback(() => {
    prefetchOwnProfileQueries(queryClient, user);
  }, [queryClient, user]);

  if (!user) return null;

  const name = displayNameForUser(user);
  const items = getAccountMenuItemsForUser(user.role === "ADMIN", isNative);

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(open) => {
        if (!isSigningOut) setMenuOpen(open);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="overflow-hidden rounded-full border border-v2-outline-variant/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/70"
          aria-label="Account menu"
        >
          <UserAvatar name={name} avatarUrl={user.avatarUrl} size="sm" className="ring-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={v2ProfileDropdownContentClassName}>
        <DropdownMenuLabel className="p-2 font-normal">
          <p className="truncate text-sm font-medium text-v2-on-surface">{name}</p>
          <p className={v2DropdownEmailClassName}>{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={v2DropdownSeparatorClassName} />
        {items.map((item) => {
          const Icon = menuIcon(item);
          const to = toV2AccountPath(item.to);
          return (
            <DropdownMenuItem
              key={item.to}
              className={v2DropdownItemClassName}
              disabled={isSigningOut}
              onMouseEnter={
                item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined
              }
              onFocus={
                item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined
              }
              onClick={() => navigate(to)}
            >
              <Icon className="mr-2 size-4 shrink-0" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className={v2DropdownSeparatorClassName} />
        <DropdownMenuItem
          className={v2DropdownDangerItemClassName}
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 size-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <LogOut className="mr-2 size-4 shrink-0" aria-hidden />
          )}
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
