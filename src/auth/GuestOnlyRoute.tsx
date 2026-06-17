import { type ReactNode } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeReturnPath, parseAuthRedirectState } from "./authRedirect";

type GuestOnlyRouteProps = {
  children: ReactNode;
  /** Fallback when no post-login return path is present. */
  redirectTo?: string;
};

export default function GuestOnlyRoute({ children, redirectTo = "/profile" }: GuestOnlyRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (user) {
    const authRedirect = parseAuthRedirectState(location.state);
    const target = getSafeReturnPath(
      authRedirect.from ?? searchParams.get("next"),
      redirectTo
    );
    return <Navigate to={target} replace />;
  }

  return children;
}
