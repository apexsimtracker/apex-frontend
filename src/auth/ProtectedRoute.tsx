import { type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isV2ShellPath, V2_AUTH_PATHS } from "@/config/navigation";
import type { AuthRedirectState } from "./authRedirect";

type ProtectedRouteProps = {
  children?: ReactNode;
  /** Shown on the login page after redirect */
  message?: string;
};

export default function ProtectedRoute({
  children,
  message,
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const state: AuthRedirectState = {
      message,
      from: `${location.pathname}${location.search}`,
    };
    return (
      <Navigate
        to={isV2ShellPath(location.pathname) ? V2_AUTH_PATHS.login : "/login"}
        replace
        state={state}
      />
    );
  }

  return children ?? <Outlet />;
}
