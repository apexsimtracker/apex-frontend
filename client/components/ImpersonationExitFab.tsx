import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  APEX_TOKEN_ADMIN_KEY,
  isImpersonating,
} from "@/lib/impersonation";

/**
 * Fixed control to leave impersonation. Restores the admin JWT from localStorage;
 * the impersonation JWT is simply abandoned (short TTL). Server-side revocation
 * would need a denylist — out of scope.
 *
 * Uses a full navigation to `/admin/users` (same idea as `window.location.assign` on
 * impersonate start) so TanStack Query and auth state cannot briefly keep the
 * impersonated user while Router navigates.
 */
export default function ImpersonationExitFab() {
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
      toast.error("Could not restore admin session. Sign out and sign in again.");
      return;
    }
    localStorage.setItem("apex_token", admin);
    localStorage.removeItem(APEX_TOKEN_ADMIN_KEY);
    window.dispatchEvent(
      new CustomEvent("apex:auth", { detail: { exitImpersonation: true } })
    );
    window.location.assign("/admin/users");
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
