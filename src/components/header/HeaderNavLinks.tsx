import { Link, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getPrimaryNavItems,
  isNavPathActive,
  type NavLinkItem,
} from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { prefetchOwnProfileQueries } from "@/lib/profileQueryKeys";
import { cn } from "@/lib/utils";

const activeUnderline =
  "absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[rgba(240,28,28,0.9)] shadow-[0_0_12px_rgba(240,28,28,0.8)] transition-all duration-200";

type HeaderNavLinksProps = {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

function NavLinkDesktop({
  item,
  active,
  prefetchOwnProfile,
}: {
  item: NavLinkItem;
  active: boolean;
  prefetchOwnProfile: () => void;
}) {
  return (
    <Link
      to={item.to}
      onMouseEnter={
        item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined
      }
      onFocus={item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined}
      className={cn(
        "relative select-none text-sm font-medium transition-colors",
        active ? "text-white" : "text-foreground/70 hover:text-foreground",
      )}
    >
      {item.label}
      {active ? <span className={activeUnderline} /> : null}
    </Link>
  );
}

function NavLinkMobile({
  item,
  active,
  prefetchOwnProfile,
  onNavigate,
}: {
  item: NavLinkItem;
  active: boolean;
  prefetchOwnProfile: () => void;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={item.to}
      onMouseEnter={
        item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined
      }
      onFocus={item.prefetch === "ownProfile" ? prefetchOwnProfile : undefined}
      onClick={onNavigate}
      className={cn(
        "block select-none rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary/70 text-white"
          : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

export default function HeaderNavLinks({
  variant,
  onNavigate,
}: HeaderNavLinksProps) {
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const items = getPrimaryNavItems(Boolean(user));

  const prefetchOwnProfile = useCallback(() => {
    prefetchOwnProfileQueries(queryClient, user);
  }, [queryClient, user]);

  if (variant === "desktop") {
    return (
      <nav className="hidden items-center gap-6 lg:flex lg:gap-8">
        {items.map((item) => (
          <NavLinkDesktop
            key={item.to}
            item={item}
            active={isNavPathActive(location.pathname, item.to, item.end)}
            prefetchOwnProfile={prefetchOwnProfile}
          />
        ))}
      </nav>
    );
  }

  return (
    <>
      {items.map((item) => (
        <NavLinkMobile
          key={item.to}
          item={item}
          active={isNavPathActive(location.pathname, item.to, item.end)}
          prefetchOwnProfile={prefetchOwnProfile}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}
