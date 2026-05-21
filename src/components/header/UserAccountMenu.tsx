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
import {
  getAccountMenuItemsForUser,
  type AccountMenuItem,
} from "@/config/navigation";
import { prefetchOwnProfileQueries } from "@/lib/profileQueryKeys";
import { useSignOut } from "@/lib/auth/useSignOut";
import type { AuthUser } from "@/lib/api";

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

export default function UserAccountMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut, isSigningOut } = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);

  const prefetchOwnProfile = useCallback(() => {
    prefetchOwnProfileQueries(queryClient, user);
  }, [queryClient, user]);

  if (!user) return null;

  const name = displayNameForUser(user);
  const items = getAccountMenuItemsForUser(user.role === "ADMIN");

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
          className="rounded-full p-0.5 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          aria-label="Account menu"
        >
          <UserAvatar name={name} avatarUrl={user.avatarUrl} size="md" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const Icon = menuIcon(item);
          return (
            <DropdownMenuItem
              key={item.to}
              className="cursor-pointer"
              disabled={isSigningOut}
              onMouseEnter={
                item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined
              }
              onFocus={
                item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined
              }
              onClick={() => navigate(item.to)}
            >
              <Icon className="mr-2 size-4" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
        >
          {isSigningOut ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="mr-2 size-4" aria-hidden />
          )}
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
