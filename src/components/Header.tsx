import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApexLogo } from "@/components/ApexLogo";
import { NotificationsBell } from "@/components/NotificationsBell";
import HeaderNavLinks from "@/components/header/HeaderNavLinks";
import HeaderAuthActions from "@/components/header/HeaderAuthActions";
import MobileNavDrawer from "@/components/header/MobileNavDrawer";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoImgFailed, setLogoImgFailed] = useState(false);
  const { user } = useAuth();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(var(--background))]/80 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="group -ml-1 flex shrink-0 items-center rounded-lg px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            {logoImgFailed ? (
              <ApexLogo className="h-9 w-auto min-w-[80px] transition-transform group-hover:scale-[1.03] sm:h-10" />
            ) : (
              <img
                src="/logo.png?v=4"
                alt="Apex Logo"
                className="h-9 w-auto max-w-[112px] object-contain object-center transition-transform group-hover:scale-[1.03] sm:h-10"
                onError={() => setLogoImgFailed(true)}
              />
            )}
          </Link>

          <HeaderNavLinks variant="desktop" />

          {/* Desktop auth actions */}
          <div className="hidden items-center gap-2 lg:flex">
            <HeaderAuthActions />
          </div>

          {/* Mobile: notifications (signed-in) + menu toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            {user ? <NotificationsBell /> : null}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen ? <MobileNavDrawer onClose={closeMenu} /> : null}
      </div>
    </header>
  );
}
