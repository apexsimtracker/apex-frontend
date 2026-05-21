/**
 * Static public routes for sitemap.xml and SEO registry.
 * Mirrors App.tsx marketing/legal paths only (no :params).
 */

export type PublicSeoRoute = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

export const PUBLIC_SEO_ROUTES: PublicSeoRoute[] = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/community", changefreq: "daily", priority: 0.95 },
  { path: "/challenges", changefreq: "weekly", priority: 0.9 },
  { path: "/leaderboards", changefreq: "daily", priority: 0.9 },
  { path: "/pricing", changefreq: "monthly", priority: 0.85 },
  { path: "/about", changefreq: "monthly", priority: 0.65 },
  { path: "/faq", changefreq: "monthly", priority: 0.65 },
  { path: "/contact", changefreq: "monthly", priority: 0.55 },
  { path: "/terms-and-conditions", changefreq: "yearly", priority: 0.45 },
  { path: "/privacy-policy", changefreq: "yearly", priority: 0.45 },
];
