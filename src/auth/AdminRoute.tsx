import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthRedirectState } from "./authRedirect";

type AdminRouteProps = {
  message?: string;
};

export default function AdminRoute({ message }: AdminRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const state: AuthRedirectState = {
      message,
      from: `${location.pathname}${location.search}`,
    };
    return <Navigate to="/login" replace state={state} />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
