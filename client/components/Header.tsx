import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsBell } from "@/components/NotificationsBell";
import HeaderNavLinks from "@/components/header/HeaderNavLinks";
import HeaderAuthActions from "@/components/header/HeaderAuthActions";
import MobileNavDrawer from "@/components/header/MobileNavDrawer";

function ApexLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Apex Logo"
    >
      <path
        d="M12 40L24 8L36 40"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 36 Q20 20 28 14 Q32 12 34 10"
        fill="none"
        stroke="url(#apex-swoosh)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 34 Q22 22 30 16"
        fill="none"
        stroke="url(#apex-swoosh2)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="33" cy="11" r="3" fill="url(#apex-glow)" />
      <circle cx="33" cy="11" r="1.5" fill="#ff6b35" />
      <path
        d="M33 11 L28 16"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id="apex-swoosh"
          x1="14"
          y1="36"
          x2="34"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b91c1c" />
          <stop offset="0.5" stopColor="#dc2626" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient
          id="apex-swoosh2"
          x1="16"
          y1="34"
          x2="30"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#dc2626" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <radialGradient
          id="apex-glow"
          cx="33"
          cy="11"
          r="3"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff8c5a" />
          <stop offset="0.6" stopColor="#ea580c" />
          <stop offset="1" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      <text
        x="48"
        y="32"
        fill="white"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="0.08em"
      >
        APEX
      </text>
    </svg>
  );
}

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
