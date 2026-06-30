import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY,
  APEX_SESSION_TOKEN_KEY,
} from "@/auth/token";
import { APEX_TOKEN_ADMIN_KEY, isImpersonating } from "@/lib/impersonation";

/**
 * Fixed control to leave impersonation. Restores the admin JWT (and browser session token)
 * from localStorage;
 * the impersonation JWT is simply abandoned (short TTL). Server-side revocation
 * would need a denylist — out of scope.
 *
 * Uses client-side navigation (WebView-safe). AuthContext clears all TanStack Query caches on
 * `exitImpersonation` so impersonated-user data cannot leak back to the admin session.
 */
export default function ImpersonationExitFab() {
  const navigate = useNavigate();
  const [, bump] = useState(0);

  const refresh = useCallback(() => {
    bump((n) => n + 1);
  }, []);

  useEffect(() => {
    const onAuth = () => refresh();
    window.addEventListener("apex:auth", onAuth);
    return () => window.removeEventListener("apex:auth", onAuth);
  }, [refresh]);

  const visible = isImpersonating();

  const exit = () => {
    const admin = localStorage.getItem(APEX_TOKEN_ADMIN_KEY);
    if (!admin?.trim()) {
      toast.error(
        "Could not restore admin session. Sign out and sign in again.",
      );
      return;
    }
    localStorage.setItem("apex_token", admin);
    localStorage.removeItem(APEX_TOKEN_ADMIN_KEY);
    const adminSession = localStorage.getItem(
      APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY,
    );
    if (adminSession?.trim()) {
      localStorage.setItem(APEX_SESSION_TOKEN_KEY, adminSession.trim());
    } else {
      localStorage.removeItem(APEX_SESSION_TOKEN_KEY);
    }
    localStorage.removeItem(APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY);
    window.dispatchEvent(
      new CustomEvent("apex:auth", { detail: { exitImpersonation: true } }),
    );
    navigate("/admin/users", { replace: true });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <Button
        type="button"
        size="sm"
        className="shadow-lg"
        variant="secondary"
        onClick={exit}
      >
        Back to admin
      </Button>
    </div>
  );
}
