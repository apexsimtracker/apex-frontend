import { Link, useLocation } from "react-router-dom";
import { APP_VERSION, SUPPORT_EMAIL } from "@/lib/appConfig";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/hooks/usePlatform";
import {
  FOOTER_TAGLINE,
  footerAuthenticatedAccountLinks,
  footerCompanyLinks,
  footerGuestAccountLinks,
  getFooterLegalLinks,
  getFooterProductLinks,
} from "@/config/navigation";

const footerLinkClass =
  "text-sm text-white/50 transition-colors hover:text-white/75";

const footerHeadingClass =
  "mb-3 text-xs font-semibold uppercase tracking-wider text-white/40";

export default function AppFooter() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const { isNative } = usePlatform();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const productLinks = getFooterProductLinks(isNative);
  const legalLinks = getFooterLegalLinks(isNative);

  const accountLinks =
    loading ? [] : user ? footerAuthenticatedAccountLinks : footerGuestAccountLinks;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 rounded">
              <img
                src="/logo.png?v=4"
                alt={`${COMPANY_NAME} logo`}
                className="h-8 w-auto max-w-[96px] object-contain opacity-90"
              />
            </Link>
            <p className="mt-3 text-sm text-white/55">{FOOTER_TAGLINE}</p>
            <p className="mt-3 text-sm text-white/45">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="underline underline-offset-2 transition-colors hover:text-white/70"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          {/* Product */}
          <div>
            <h2 className={footerHeadingClass}>Product</h2>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h2 className={footerHeadingClass}>Account</h2>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & legal */}
          <div>
            <h2 className={footerHeadingClass}>Company</h2>
            <ul className="mb-6 space-y-2">
              {footerCompanyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className={footerHeadingClass}>Legal</h2>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/5 pt-6 text-xs text-white/35 sm:flex-row">
          <span>
            © {year} {COMPANY_NAME}
          </span>
          <span>Version {APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
