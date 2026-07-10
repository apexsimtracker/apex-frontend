import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearToken } from "@/auth/token";
import { useAuth } from "@/contexts/AuthContext";
import { isV2ShellPath, V2_HOME_PATH } from "@/config/navigation";
import { authLogout } from "@/lib/api";

/** Clears session locally and navigates home (server logout is best-effort). */
export function useSignOut() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      try {
        await authLogout();
      } catch {
        // Server revoke is best-effort; always clear local credentials.
      }
      clearToken();
      setUser(null);
      navigate(isV2ShellPath(location.pathname) ? V2_HOME_PATH : "/", {
        replace: true,
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, location.pathname, navigate, setUser]);

  return { signOut, isSigningOut };
}
