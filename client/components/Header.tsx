import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { prefetchOwnProfileQueries } from "@/lib/profileQueryKeys";
import { Menu, X, Settings, Bot, Plus, Upload, PenLine, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ApexLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Apex Logo"
    >
      {/* Triangle outline - two white lines meeting at apex */}
      <path
        d="M12 40L24 8L36 40"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Red/orange swooshes inside triangle */}
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
      {/* Glowing dot at top right */}
      <circle cx="33" cy="11" r="3" fill="url(#apex-glow)" />
      <circle cx="33" cy="11" r="1.5" fill="#ff6b35" />
      {/* Light line from dot */}
      <path d="M33 11 L28 16" stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="apex-swoosh" x1="14" y1="36" x2="34" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b91c1c" />
          <stop offset="0.5" stopColor="#dc2626" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="apex-swoosh2" x1="16" y1="34" x2="30" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#dc2626" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <radialGradient id="apex-glow" cx="33" cy="11" r="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff8c5a" />
          <stop offset="0.6" stopColor="#ea580c" />
          <stop offset="1" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      {/* APEX text below */}
      <text x="48" y="32" fill="white" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="20" letterSpacing="0.08em">
        APEX
      </text>
    </svg>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileCreateOpen, setIsMobileCreateOpen] = useState(false);
  const [logoImgFailed, setLogoImgFailed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchOwnProfile = useCallback(() => {
    prefetchOwnProfileQueries(queryClient, user);
  }, [queryClient, user]);

  const isPathActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

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

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex lg:gap-8">
            <Link
              to="/"
              className={`relative text-sm font-medium transition-colors ${
                isPathActive("/")
                  ? "text-white"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Home
              {isPathActive("/") && (
                <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[rgba(240,28,28,0.9)] shadow-[0_0_12px_rgba(240,28,28,0.8)] transition-all duration-200" />
              )}
            </Link>
            <Link
              to="/profile"
              onMouseEnter={prefetchOwnProfile}
              onFocus={prefetchOwnProfile}
              className={`relative text-sm font-medium transition-colors ${
                isPathActive("/profile")
                  ? "text-white"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Profile
              {isPathActive("/profile") && (
                <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[rgba(240,28,28,0.9)] shadow-[0_0_12px_rgba(240,28,28,0.8)] transition-all duration-200" />
              )}
            </Link>
            <Link
              to="/community"
              className={`relative text-sm font-medium transition-colors ${
                isPathActive("/community")
                  ? "text-white"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Community
              {isPathActive("/community") && (
                <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[rgba(240,28,28,0.9)] shadow-[0_0_12px_rgba(240,28,28,0.8)] transition-all duration-200" />
              )}
            </Link>
            <Link
              to="/challenges"
              className={`relative text-sm font-medium transition-colors ${
                isPathActive("/challenges")
                  ? "text-white"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Challenges
              {isPathActive("/challenges") && (
                <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[rgba(240,28,28,0.9)] shadow-[0_0_12px_rgba(240,28,28,0.8)] transition-all duration-200" />
              )}
            </Link>
            <Link
              to="/leaderboards"
              className={`relative text-sm font-medium transition-colors ${
                isPathActive("/leaderboards")
                  ? "text-white"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Leaderboards
              {isPathActive("/leaderboards") && (
                <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-[rgba(240,28,28,0.9)] shadow-[0_0_12px_rgba(240,28,28,0.8)] transition-all duration-200" />
              )}
            </Link>
          </nav>

          {/* Desktop Controls */}
          <div className="hidden items-center gap-2 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/5 bg-white px-3.5 py-1.5 text-sm font-medium text-black shadow-sm transition-all hover:bg-white/95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                >
                  <Plus className="size-4" />
                  Create
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/upload")}
                >
                  <Upload className="mr-2 size-4" />
                  Upload Session
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/manual")}
                >
                  <PenLine className="mr-2 size-4" />
                  Log Manual Activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/agent"
              className="group rounded-lg p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              aria-label="Agent"
              title="Agent"
            >
              <Bot className="size-5 text-foreground/70 transition-colors group-hover:text-foreground" />
            </Link>
            <Link
              to="/settings"
              className="group rounded-lg p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="size-5 text-foreground/70 transition-colors group-hover:text-foreground" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              {isMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="space-y-1 border-t border-white/10 py-4 md:hidden">
            <Link
              to="/"
              className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isPathActive("/")
                  ? "bg-secondary/70 text-white"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/profile"
              onMouseEnter={prefetchOwnProfile}
              onFocus={prefetchOwnProfile}
              className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isPathActive("/profile")
                  ? "bg-secondary/70 text-white"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              to="/community"
              className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isPathActive("/community")
                  ? "bg-secondary/70 text-white"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              to="/challenges"
              className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isPathActive("/challenges")
                  ? "bg-secondary/70 text-white"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Challenges
            </Link>
            <Link
              to="/leaderboards"
              className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isPathActive("/leaderboards")
                  ? "bg-secondary/70 text-white"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Leaderboards
            </Link>
            {/* Mobile Create Section */}
            <div className="mt-2 border pt-2">
              <button
                type="button"
                onClick={() => setIsMobileCreateOpen(!isMobileCreateOpen)}
                className="flex w-full items-center justify-between rounded-lg px-4 py-2 font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <Plus className="size-4" />
                  Create
                </span>
                <ChevronDown
                  className={`size-4 transition-transform ${
                    isMobileCreateOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isMobileCreateOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    to="/upload"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMobileCreateOpen(false);
                    }}
                  >
                    <Upload className="size-4" />
                    Upload Session
                  </Link>
                  <Link
                    to="/manual"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMobileCreateOpen(false);
                    }}
                  >
                    <PenLine className="size-4" />
                    Log Manual Activity
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/agent"
              className="block rounded-lg px-4 py-2 font-medium text-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Agent
            </Link>
            <Link
              to="/settings"
              className="block rounded-lg px-4 py-2 font-medium text-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
