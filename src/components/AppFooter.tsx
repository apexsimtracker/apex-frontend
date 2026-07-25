import { Link, useLocation } from "react-router-dom";
import { APP_VERSION, SUPPORT_EMAIL } from "@/lib/appConfig";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/hooks/usePlatform";
import { FOOTER_TAGLINE, footerAuthenticatedAccountLinks, footerCompanyLinks, footerGuestAccountLinks, getFooterLegalLinks, getFooterProductLinks, type FooterLinkItem } from "@/config/navigation";

const footerLinkClass =
  "text-sm text-apex-on-surface-variant transition-colors hover:text-apex-primary";

const footerHeadingClass =
  "mb-4 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant";

function FooterLinkList({ links }: { links: FooterLinkItem[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.to}>
          <Link to={link.to} className={footerLinkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function mapFooterLinks(links: FooterLinkItem[]): FooterLinkItem[] {
  return links;
}

export default function AppFooter() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const { isNative } = usePlatform();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const productLinks = mapFooterLinks(getFooterProductLinks(isNative));
  const legalLinks = mapFooterLinks(getFooterLegalLinks(isNative));
  const companyLinks = mapFooterLinks(
    footerCompanyLinks.filter((link) => link.to !== "/contact"),
  );

  const accountLinks = loading
    ? []
    : mapFooterLinks(
        user ? footerAuthenticatedAccountLinks : footerGuestAccountLinks,
      );
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto hidden lg:block">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-apex-primary/50 to-transparent" />
      <div className="border-t border-apex-outline-variant/10 bg-gradient-to-b from-apex-surface-container-low to-apex-background">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link
                to="/"
                className="inline-block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/70"
              >
                <img
                  src="/logo.png?v=5"
                  alt={`${COMPANY_NAME} logo`}
                  className="h-9 w-auto max-w-[104px] object-contain"
                />
              </Link>
              <p className="mt-4 max-w-sm font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
                {FOOTER_TAGLINE}
              </p>
            </div>

            <div>
              <h2 className={footerHeadingClass}>Product</h2>
              <FooterLinkList links={productLinks} />
            </div>

            <div>
              <h2 className={footerHeadingClass}>Account</h2>
              <FooterLinkList links={accountLinks} />
            </div>

            <div>
              <h2 className={footerHeadingClass}>Company</h2>
              <FooterLinkList links={companyLinks} />
            </div>

            <div>
              <h2 className={footerHeadingClass}>Legal</h2>
              <FooterLinkList links={legalLinks} />
            </div>
          </div>

          <div className="mt-10 grid gap-8 border-t border-apex-outline-variant/10 pt-8 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <h2 className={footerHeadingClass}>Support</h2>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className={footerLinkClass}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </li>
                <li>
                  <Link to="/contact" className={footerLinkClass}>
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-4 lg:items-end">
              <div className="flex flex-col gap-1 text-left lg:text-right">
                <span className="font-apex-body text-xs text-apex-on-surface-variant/70">
                  © {year} {COMPANY_NAME}
                </span>
                <span className="font-apex-body text-xs text-apex-on-surface-variant/50">
                  Version {APP_VERSION}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
