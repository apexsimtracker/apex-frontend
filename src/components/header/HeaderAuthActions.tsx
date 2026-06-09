import { Link, useNavigate } from "react-router-dom";
import { Plus, Upload, PenLine } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "@/components/NotificationsBell";
import { UserSearchTrigger } from "@/components/UserSearchTrigger";
import { useAuth } from "@/contexts/AuthContext";
import UserAccountMenu from "./UserAccountMenu";
import AuthActionsPlaceholder from "./AuthActionsPlaceholder";

export default function HeaderAuthActions() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <AuthActionsPlaceholder />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          Sign in
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center rounded-lg border border-black/5 bg-white px-3.5 py-1.5 text-sm font-medium text-black shadow-sm transition-all hover:bg-white/95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <UserSearchTrigger />
      <NotificationsBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
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
      <UserAccountMenu />
    </div>
  );
}
