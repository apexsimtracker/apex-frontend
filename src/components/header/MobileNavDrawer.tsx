import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Plus, Upload, PenLine } from "lucide-react";
import HeaderNavLinks from "./HeaderNavLinks";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/hooks/usePlatform";
import { getAccountMenuItemsForUser } from "@/config/navigation";
import { cn } from "@/lib/utils";
import AuthActionsPlaceholder from "./AuthActionsPlaceholder";

type MobileNavDrawerProps = {
  onClose: () => void;
};

export default function MobileNavDrawer({ onClose }: MobileNavDrawerProps) {
  const { user, loading } = useAuth();
  const { isNative } = usePlatform();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const accountItems = user
    ? getAccountMenuItemsForUser(user.role === "ADMIN", isNative)
    : [];

  return (
    <nav className="space-y-1 border-t border-white/10 py-4 lg:hidden">
      <HeaderNavLinks variant="mobile" onNavigate={onClose} />

      {loading ? (
        <div className="mt-2 border-t border-white/10 px-4 pt-4">
          <AuthActionsPlaceholder className="h-20 w-full" />
        </div>
      ) : user ? (
        <>
          <div className="mt-2 border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="flex w-full items-center justify-between rounded-lg px-4 py-2 font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <span className="flex items-center gap-2">
                <Plus className="size-4" />
                Create
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  isCreateOpen && "rotate-180",
                )}
              />
            </button>
            {isCreateOpen ? (
              <div className="ml-4 mt-1 space-y-1">
                <Link
                  to="/upload"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => {
                    onClose();
                    setIsCreateOpen(false);
                  }}
                >
                  <Upload className="size-4" />
                  Upload Session
                </Link>
                <Link
                  to="/manual"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => {
                    onClose();
                    setIsCreateOpen(false);
                  }}
                >
                  <PenLine className="size-4" />
                  Log Manual Activity
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Account
            </p>
            {accountItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/60 hover:text-foreground"
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-2 flex flex-col gap-2 border-t border-white/10 px-4 pt-4">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-center text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/60"
            onClick={onClose}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-black shadow-sm transition-colors hover:bg-white/95"
            onClick={onClose}
          >
            Get started
          </Link>
        </div>
      )}
    </nav>
  );
}
