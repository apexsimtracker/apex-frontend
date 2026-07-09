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

export const primaryNavItems: NavLinkItem[] = [
  { label: "Home", to: "/", audience: "both", end: true },
  { label: "Community", to: "/community", audience: "both" },
  { label: "Challenges", to: "/challenges", audience: "both" },
  { label: "Leaderboards", to: "/leaderboards", audience: "both" },
  { label: "Pricing", to: "/pricing", audience: "both" },
  { label: "Sessions", to: "/sessions", audience: "authenticated" },
];

/** Hub header / mobile drawer primary links for V2 shell pages. */
export const primaryNavItemsV2: NavLinkItem[] = [
  { label: "Home", to: "/v2", audience: "both", end: true },
  { label: "Leaderboards", to: "/v2/leaderboards", audience: "both" },
  { label: "Challenges", to: "/v2/challenges", audience: "both" },
  { label: "Community", to: "/v2/community", audience: "both" },
  { label: "Pricing", to: "/v2/pricing", audience: "both" },
  { label: "Sessions", to: "/v2/sessions", audience: "authenticated" },
];

export type LogSessionMenuIcon = "agent" | "manual" | "upload";

export type LogSessionMenuItemV2 = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  icon: LogSessionMenuIcon;
  featured?: boolean;
  proBadge?: boolean;
};

/** Log a Session chooser — sheet (mobile/tablet) and create dropdown (desktop). */
export const logSessionMenuItemsV2: LogSessionMenuItemV2[] = [
  {
    id: "agent",
    title: "Auto-track",
    subtitle: "Apex Agent uploads as you drive — iRacing, F1 25, LMU",
    to: "/v2/agent",
    icon: "agent",
    featured: true,
    proBadge: true,
  },
  {
    id: "manual",
    title: "Log manually",
    subtitle: "Add session details by hand",
    to: "/v2/manual",
    icon: "manual",
  },
  {
    id: "upload",
    title: "Import from file",
    subtitle: "LMU .duckdb · F1 25 telemetry · iRacing .ibt",
    to: "/v2/upload",
    icon: "upload",
  },
];

/** @deprecated Use logSessionMenuItemsV2 */
export const createMenuItemsV2 = logSessionMenuItemsV2.map((item) => ({
  label: item.title,
  to: item.to,
  icon: item.icon === "agent" ? ("upload" as const) : item.icon,
}));

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
  { label: "EULA", to: "/eula", webOnly: true },
];

export const FOOTER_TAGLINE = "Sim racing performance hub";

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

export function getPrimaryNavItemsV2(isAuthenticated: boolean): NavLinkItem[] {
  return primaryNavItemsV2.filter((item) => {
    if (item.audience === "both") return true;
    if (item.audience === "authenticated") return isAuthenticated;
    return !isAuthenticated;
  });
}

/** Map V1 account paths to V2 where a V2 route exists. */
export function toV2AccountPath(to: string): string {
  const map: Record<string, string> = {
    "/profile": "/v2/profile",
    "/settings": "/v2/settings",
    "/agent": "/v2/agent",
    "/personal-bests": "/v2/personal-bests",
  };
  return map[to] ?? to;
}

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

export function isNavPathActive(
  pathname: string,
  path: string,
  end?: boolean,
): boolean {
  if (path === "/") return pathname === "/";
  if (path === "/v2") return pathname === "/v2";
  if (end) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}
