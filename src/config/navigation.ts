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

/** V2 desktop footer — slightly longer than V1 one-liner. */
export const FOOTER_TAGLINE_V2 =
  "Your sim racing performance hub. Track sessions, analyze telemetry, and compete on leaderboards and community challenges across iRacing, ACC, and your favorite sims.";

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

export const V2_HOME_PATH = "/v2";

export const V2_AUTH_PATHS = {
  login: "/v2/login",
  signup: "/v2/signup",
  forgotPassword: "/v2/forgot-password",
  verifyEmail: "/v2/verify-email",
} as const;

const V1_TO_V2_EXACT: Record<string, string> = {
  "/": V2_HOME_PATH,
  "/profile": "/v2/profile",
  "/settings": "/v2/settings",
  "/agent": "/v2/agent",
  "/personal-bests": "/v2/personal-bests",
  "/community": "/v2/community",
  "/challenges": "/v2/challenges",
  "/leaderboards": "/v2/leaderboards",
  "/pricing": "/v2/pricing",
  "/sessions": "/v2/sessions",
  "/about": "/v2/about",
  "/faq": "/v2/faq",
  "/contact": "/v2/contact",
  "/terms-and-conditions": "/v2/terms-and-conditions",
  "/privacy-policy": "/v2/privacy-policy",
  "/cookie-policy": "/v2/cookie-policy",
  "/eula": "/v2/eula",
  "/login": V2_AUTH_PATHS.login,
  "/signup": V2_AUTH_PATHS.signup,
  "/forgot-password": V2_AUTH_PATHS.forgotPassword,
  "/verify-email": V2_AUTH_PATHS.verifyEmail,
  "/upload": "/v2/upload",
  "/manual": "/v2/manual",
  "/upgrade": "/v2/pricing",
};

/** V1 path prefixes that map to `/v2` + same suffix (e.g. `/sessions/:id`). */
const V1_TO_V2_PREFIXES = [
  "/sessions/",
  "/user/",
  "/discussion/",
  "/challenge/",
] as const;

function splitAppPath(path: string): {
  pathname: string;
  search: string;
  hash: string;
} {
  const hashIndex = path.indexOf("#");
  const beforeHash = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  const pathname =
    queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const search = queryIndex === -1 ? "" : beforeHash.slice(queryIndex);
  return { pathname, search, hash };
}

/** True when the current route is inside the V2 shell. */
export function isV2ShellPath(pathname: string): boolean {
  return pathname === V2_HOME_PATH || pathname.startsWith(`${V2_HOME_PATH}/`);
}

/**
 * Map any known V1 app path to its V2 equivalent.
 * Pass-through for `/v2/*`, `/admin`, and external URLs.
 */
export function toV2Path(to: string): string {
  if (
    !to ||
    to.startsWith("http") ||
    to.startsWith("mailto:") ||
    to.startsWith("//")
  ) {
    return to;
  }
  if (to.startsWith("/v2") || to.startsWith("/admin")) {
    return to;
  }

  const { pathname, search, hash } = splitAppPath(to);
  const exact = V1_TO_V2_EXACT[pathname];
  if (exact) {
    return `${exact}${search}${hash}`;
  }

  for (const prefix of V1_TO_V2_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return `/v2${pathname}${search}${hash}`;
    }
  }

  return to;
}

/** Map V1 paths to V2 when the user is browsing inside the V2 shell. */
export function toV2AwarePath(path: string, inV2Shell: boolean): string {
  if (!inV2Shell) return path;
  return toV2Path(path);
}

/** Map V1 account paths to V2 where a V2 route exists. */
export function toV2AccountPath(to: string): string {
  return toV2Path(to);
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
