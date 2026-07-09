/** Guest-only auth pages that manage their own submit loading UI. */
export const GUEST_AUTH_PATHS = [
  "/login",
  "/v2/login",
  "/signup",
  "/v2/signup",
  "/verify-email",
  "/v2/verify-email",
  "/forgot-password",
  "/v2/forgot-password",
] as const;

export function isGuestAuthPath(pathname: string): boolean {
  return (GUEST_AUTH_PATHS as readonly string[]).includes(pathname);
}
