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
  /** Hidden in Capacitor native shell (e.g. desktop-agent download). */
  webOnly?: boolean;
};

/** Hub header / mobile drawer primary links. */
export const primaryNavItems: NavLinkItem[] = [
  { label: "Home", to: "/", audience: "both", end: true },
  { label: "Leaderboards", to: "/leaderboards", audience: "both" },
  { label: "Challenges", to: "/challenges", audience: "both" },
  { label: "Community", to: "/community", audience: "both" },
  { label: "Pricing", to: "/pricing", audience: "both" },
  { label: "Sessions", to: "/sessions", audience: "authenticated" },
];

export type LogSessionMenuIcon = "agent" | "manual" | "upload";

export type LogSessionMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  icon: LogSessionMenuIcon;
  featured?: boolean;
  proBadge?: boolean;
  /** Hidden in Capacitor native shell (desktop-agent download). */
  webOnly?: boolean;
};

/** Log a Session chooser — sheet (mobile/tablet) and create dropdown (desktop). */
export const logSessionMenuItems: LogSessionMenuItem[] = [
  {
    id: "agent",
    title: "Auto-track",
    subtitle: "Apex Agent uploads as you drive — iRacing, F1 25, LMU",
    to: "/agent",
    icon: "agent",
    featured: true,
    proBadge: true,
    webOnly: true,
  },
  {
    id: "manual",
    title: "Log manually",
    subtitle: "Add session details by hand",
    to: "/manual",
    icon: "manual",
  },
  {
    id: "upload",
    title: "Import from file",
    subtitle: "LMU .duckdb · F1 25 telemetry · iRacing .ibt",
    to: "/upload",
    icon: "upload",
  },
];

export type AccountMenuItem = {
  label: string;
  to: string;
  prefetch?: NavPrefetch;
  /** Only shown when user.role === "ADMIN". */
  adminOnly?: boolean;
  /** Hidden in Capacitor native shell (e.g. desktop-agent download). */
  webOnly?: boolean;
};

export const accountMenuItems: AccountMenuItem[] = [
  { label: "Profile", to: "/profile", prefetch: "ownProfile" },
  { label: "Personal bests", to: "/personal-bests" },
  { label: "Settings", to: "/settings" },
  { label: "Agent", to: "/agent", webOnly: true },
  { label: "Admin dashboard", to: "/admin", adminOnly: true, webOnly: true },
];

export const footerProductLinks: FooterLinkItem[] = [
  { label: "Community", to: "/community" },
  { label: "Challenges", to: "/challenges" },
  { label: "Leaderboards", to: "/leaderboards" },
  { label: "Pricing", to: "/pricing" },
  { label: "Agent", to: "/agent", webOnly: true },
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
  { label: "Cookies", to: "/cookie-policy" },
  { label: "EULA", to: "/eula" },
];

/** Desktop footer tagline. */
export const FOOTER_TAGLINE =
  "Your sim racing performance hub. Track sessions, analyze telemetry, and compete on leaderboards and community challenges across iRacing and your favorite sims.";

function withoutWebOnlyNavItems<T extends { webOnly?: boolean }>(
  items: T[],
  isNative: boolean,
): T[] {
  if (!isNative) return items;
  return items.filter((item) => !item.webOnly);
}

export function getPrimaryNavItems(isAuthenticated: boolean): NavLinkItem[] {
  return primaryNavItems.filter((item) => {
    if (item.audience === "both") return true;
    if (item.audience === "authenticated") return isAuthenticated;
    return !isAuthenticated;
  });
}

export const HOME_PATH = "/";

export const AUTH_PATHS = {
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  verifyEmail: "/verify-email",
} as const;

export function getAccountMenuItemsForUser(
  isAdmin: boolean,
  isNative = false,
): AccountMenuItem[] {
  const items = accountMenuItems.filter((item) => !item.adminOnly || isAdmin);
  return withoutWebOnlyNavItems(items, isNative);
}

export function getFooterProductLinks(isNative = false): FooterLinkItem[] {
  return withoutWebOnlyNavItems(footerProductLinks, isNative);
}

export function getFooterLegalLinks(isNative = false): FooterLinkItem[] {
  return withoutWebOnlyNavItems(footerLegalLinks, isNative);
}

export function getLogSessionMenuItems(isNative = false): LogSessionMenuItem[] {
  return withoutWebOnlyNavItems(logSessionMenuItems, isNative);
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
