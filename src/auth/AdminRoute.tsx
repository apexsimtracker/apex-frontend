import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthRedirectState } from "./authRedirect";

type AdminRouteProps = {
  /** Shown on the login page after redirect */
  message?: string;
};

export default function AdminRoute({ message }: AdminRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/" replace />;
  }

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
