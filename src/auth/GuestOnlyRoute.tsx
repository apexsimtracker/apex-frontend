import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type GuestOnlyRouteProps = {
  children: ReactNode;
  /** Where to send authenticated users (default app home). */
  redirectTo?: string;
};

export default function GuestOnlyRoute({ children, redirectTo = "/" }: GuestOnlyRouteProps) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
