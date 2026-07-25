import { Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getPrimaryNavItems, isNavPathActive, type NavLinkItem } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionsNavActive } from "@/hooks/useSessionsNavActive";
import { prefetchNavIntent } from "@/lib/navIntentPrefetch";
import { cn } from "@/lib/utils";

const activeUnderline =
  "absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-apex-primary shadow-[0_0_12px_rgba(225,6,0,0.6)] transition-all duration-200";

function NavLinkDesktop({
  item,
  active,
  onIntent,
}: {
  item: NavLinkItem;
  active: boolean;
  onIntent: (to: string) => void;
}) {
  return (
    <Link
      to={item.to}
      onPointerEnter={() => onIntent(item.to)}
      onPointerDown={() => onIntent(item.to)}
      onFocus={() => onIntent(item.to)}
      className={cn(
        "relative select-none font-apex-headline text-xs font-medium uppercase tracking-widest transition-colors",
        active
          ? "text-apex-primary"
          : "text-apex-on-surface-variant hover:text-apex-on-surface",
      )}
    >
      {item.label}
      {active ? <span className={activeUnderline} aria-hidden /> : null}
    </Link>
  );
}

export default function HubTopBarNavLinks() {
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const items = getPrimaryNavItems(Boolean(user));
  const sessionsNavActive = useSessionsNavActive();

  const onIntent = (to: string) => {
    prefetchNavIntent(to, queryClient, { userId: user?.id });
  };

  return (
    <nav
      className="hidden items-center gap-6 lg:flex lg:gap-8"
      aria-label="Primary navigation"
    >
      {items.map((item) => (
        <NavLinkDesktop
          key={item.to}
          item={item}
          onIntent={onIntent}
          active={
            item.to === "/sessions"
              ? sessionsNavActive
              : isNavPathActive(location.pathname, item.to, item.end)
          }
        />
      ))}
    </nav>
  );
}
