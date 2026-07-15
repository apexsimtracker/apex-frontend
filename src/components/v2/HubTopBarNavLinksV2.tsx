import { Link, useLocation } from "react-router-dom";
import {
  getPrimaryNavItemsV2,
  isNavPathActive,
  type NavLinkItem,
} from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionsNavActiveV2 } from "@/hooks/useSessionsNavActiveV2";
import { cn } from "@/lib/utils";

const activeUnderline =
  "absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-v2-primary shadow-[0_0_12px_rgba(225,6,0,0.6)] transition-all duration-200";

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
        "relative select-none font-v2-headline text-xs font-medium uppercase tracking-widest transition-colors",
        active
          ? "text-v2-primary"
          : "text-v2-on-surface-variant hover:text-v2-on-surface",
      )}
    >
      {item.label}
      {active ? <span className={activeUnderline} aria-hidden /> : null}
    </Link>
  );
}

export default function HubTopBarNavLinksV2() {
  const location = useLocation();
  const { user } = useAuth();
  const items = getPrimaryNavItemsV2(Boolean(user));
  const sessionsNavActive = useSessionsNavActiveV2();

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
            item.to === "/v2/sessions"
              ? sessionsNavActive
              : isNavPathActive(location.pathname, item.to, item.end)
          }
        />
      ))}
    </nav>
  );
}
