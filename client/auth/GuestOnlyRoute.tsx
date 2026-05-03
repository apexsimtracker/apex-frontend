import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type GuestOnlyRouteProps = {
  children: ReactNode;
  /** Where to send authenticated users (default app home). */
  redirectTo?: string;
};

export default function GuestOnlyRoute({ children, redirectTo = "/" }: GuestOnlyRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
