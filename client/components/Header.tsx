import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Settings, Cpu, Plus, Upload, PenLine, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileCreateOpen, setIsMobileCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F28a62c25c1b348f89516f18f1616bb52%2F5c6067b014264622a90319386ee8f54e?format=webp&width=800&height=1200"
              alt="Apex Logo"
              className="w-8 h-8"
            />
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
