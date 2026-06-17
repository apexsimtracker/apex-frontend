/** Guest-only auth pages that manage their own submit loading UI. */
export const GUEST_AUTH_PATHS = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
] as const;

export function isGuestAuthPath(pathname: string): boolean {
  return (GUEST_AUTH_PATHS as readonly string[]).includes(pathname);
}
