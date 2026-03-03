import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Settings, Cpu, Plus, Upload, PenLine, ChevronDown } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-50 border-b border bg-[hsl(var(--background))] bg-opacity-100 shadow-[0_1px_0_0_hsl(var(--border))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center flex-shrink-0 group">
            {logoImgFailed ? (
              <ApexLogo className="h-9 w-auto min-w-[72px]" />
            ) : (
              <img
                src="/logo.png?v=4"
                alt="Apex Logo"
                className="h-9 w-auto max-w-[100px] object-contain object-center"
                onError={() => setLogoImgFailed(true)}
              />
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-foreground hover:text-foreground transition-colors font-medium text-sm"
            >
              Home
            </Link>
            <Link
              to="/profile"
              className="text-foreground hover:text-foreground transition-colors font-medium text-sm"
            >
              Profile
            </Link>
            <Link
              to="/community"
              className="text-foreground hover:text-foreground transition-colors font-medium text-sm"
            >
              Community
            </Link>
            <Link
              to="/challenges"
              className="text-foreground hover:text-foreground transition-colors font-medium text-sm"
            >
              Challenges
            </Link>
            <Link
              to="/leaderboards"
              className="text-foreground hover:text-foreground transition-colors font-medium text-sm"
            >
              Leaderboards
            </Link>
          </nav>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/upload")}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Session
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/manual")}
                >
                  <PenLine className="w-4 h-4 mr-2" />
                  Log Manual Activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/agent"
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Agent"
            >
              <Cpu className="w-5 h-5 text-foreground" />
            </Link>
            <Link
              to="/settings"
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border">
            <Link
              to="/"
              className="block px-4 py-2 text-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/profile"
              className="block px-4 py-2 text-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              to="/community"
              className="block px-4 py-2 text-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              to="/challenges"
              className="block px-4 py-2 text-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Challenges
            </Link>
            <Link
              to="/leaderboards"
              className="block px-4 py-2 text-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Leaderboards
            </Link>
            {/* Mobile Create Section */}
            <div className="border-t border mt-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMobileCreateOpen(!isMobileCreateOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isMobileCreateOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isMobileCreateOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    to="/upload"
                    className="flex items-center gap-2 px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-secondary rounded-lg transition-colors text-sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMobileCreateOpen(false);
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Session
                  </Link>
                  <Link
                    to="/manual"
                    className="flex items-center gap-2 px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-secondary rounded-lg transition-colors text-sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMobileCreateOpen(false);
                    }}
                  >
                    <PenLine className="w-4 h-4" />
                    Log Manual Activity
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/agent"
              className="block px-4 py-2 text-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Agent
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors font-medium"
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
