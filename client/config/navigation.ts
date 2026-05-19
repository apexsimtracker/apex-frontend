/**
 * Single source of truth for header, mobile drawer, account menu, and footer links.
 */

export type NavAudience = "public" | "authenticated" | "both";

export type NavPrefetch = "ownProfile";

export type NavLinkItem = {
  label: string;
  to: string;
  audience: NavAudience;
  /** Exact match only (e.g. Home at `/`). */
  end?: boolean;
  prefetch?: NavPrefetch;
};

export type FooterLinkItem = {
  label: string;
  to: string;
};

export const primaryNavItems: NavLinkItem[] = [
  { label: "Home", to: "/", audience: "both", end: true },
  { label: "Community", to: "/community", audience: "both" },
  { label: "Challenges", to: "/challenges", audience: "both" },
  { label: "Leaderboards", to: "/leaderboards", audience: "both" },
  { label: "Pricing", to: "/pricing", audience: "both" },
  { label: "Sessions", to: "/sessions", audience: "authenticated" },
];

export type AccountMenuItem = {
  label: string;
  to: string;
  prefetch?: NavPrefetch;
  /** Only shown when user.role === "ADMIN". */
  adminOnly?: boolean;
};

export const accountMenuItems: AccountMenuItem[] = [
  { label: "Profile", to: "/profile", prefetch: "ownProfile" },
  { label: "Personal bests", to: "/personal-bests" },
  { label: "Settings", to: "/settings" },
  { label: "Agent", to: "/agent" },
  { label: "Admin dashboard", to: "/admin", adminOnly: true },
];

export const createMenuItems = [
  { label: "Upload Session", to: "/upload", icon: "upload" as const },
  { label: "Log Manual Activity", to: "/manual", icon: "manual" as const },
];

export const footerProductLinks: FooterLinkItem[] = [
  { label: "Community", to: "/community" },
  { label: "Challenges", to: "/challenges" },
  { label: "Leaderboards", to: "/leaderboards" },
  { label: "Pricing", to: "/pricing" },
  { label: "Agent", to: "/agent" },
];

export const footerGuestAccountLinks: FooterLinkItem[] = [
  { label: "Sign in", to: "/login" },
  { label: "Get started", to: "/signup" },
];

export const footerAuthenticatedAccountLinks: FooterLinkItem[] = [
  { label: "Profile", to: "/profile" },
  { label: "Sessions", to: "/sessions" },
  { label: "Settings", to: "/settings" },
];

export const footerCompanyLinks: FooterLinkItem[] = [
  { label: "About us", to: "/about" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact us", to: "/contact" },
];

export const footerLegalLinks: FooterLinkItem[] = [
  { label: "Terms", to: "/terms-and-conditions" },
  { label: "Privacy", to: "/privacy-policy" },
];

export const FOOTER_TAGLINE = "Sim racing performance hub";

export function getPrimaryNavItems(isAuthenticated: boolean): NavLinkItem[] {
  return primaryNavItems.filter((item) => {
    if (item.audience === "both") return true;
    if (item.audience === "authenticated") return isAuthenticated;
    return !isAuthenticated;
  });
}

export function getAccountMenuItemsForUser(
  isAdmin: boolean,
): AccountMenuItem[] {
  return accountMenuItems.filter((item) => !item.adminOnly || isAdmin);
}

export function isNavPathActive(
  pathname: string,
  path: string,
  end?: boolean,
): boolean {
  if (path === "/") return pathname === "/";
  if (end) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}
