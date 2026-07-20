import { Link, useLocation } from "react-router-dom";
import { getPrimaryNavItems, isNavPathActive, type NavLinkItem } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionsNavActive } from "@/hooks/useSessionsNavActive";
import { cn } from "@/lib/utils";

const activeUnderline =
  "absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-apex-primary shadow-[0_0_12px_rgba(225,6,0,0.6)] transition-all duration-200";

function NavLinkDesktop({
  item,
  active,
}: {
  item: NavLinkItem;
  active: boolean;
}) {
  return (
    <Link
      to={item.to}
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
  const items = getPrimaryNavItems(Boolean(user));
  const sessionsNavActive = useSessionsNavActive();

  return (
    <nav
      className="hidden items-center gap-6 lg:flex lg:gap-8"
      aria-label="Primary navigation"
    >
      {items.map((item) => (
        <NavLinkDesktop
          key={item.to}
          item={item}
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
