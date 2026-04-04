import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { SUPPORT_EMAIL } from "@/lib/appConfig";

export default function TermsAndConditions() {
  const path = "/terms-and-conditions";
  const title = `Terms & Conditions | ${COMPANY_NAME}`;
  const description = `Terms and conditions for using ${COMPANY_NAME} at ${SITE_ORIGIN.replace("https://", "")}.`;

  return (
    <>
      <PageMeta title={title} description={description} path={path} />
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <article className="max-w-3xl mx-auto">
            <header className="mb-10 border-b border-white/10 pb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Terms &amp; Conditions
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Last updated: 4 April 2026
              </p>
            </header>

            <div className="space-y-8 text-sm text-foreground/90 leading-relaxed [&_strong]:text-foreground [&_a]:text-white/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white">
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">1. Agreement</h2>
                <p>
                  These Terms &amp; Conditions (“Terms”) govern your access to and use of the website and services
                  operated by {COMPANY_NAME} (“we”, “us”, “our”) at{" "}
                  <a href={SITE_ORIGIN}>{SITE_ORIGIN.replace(/^https:\/\//, "")}</a> (the “Service”). By accessing or
                  using the Service, you agree to these Terms. If you do not agree, do not use the Service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">2. Who we are</h2>
                <p>
                  The Service is provided by {COMPANY_NAME}. For questions about these Terms, contact us at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">3. The Service</h2>
                <p>
                  {COMPANY_NAME} provides online tools and related features for sim racing and session tracking,
                  community features, and other functionality we may introduce from time to time. We may modify,
                  suspend, or discontinue any part of the Service with reasonable notice where practicable.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">4. Accounts and eligibility</h2>
                <p>
                  You must provide accurate registration information and keep your credentials secure. You are
                  responsible for activity under your account. You must be at least 13 years old to use the Service,
                  or the minimum age required in your country if higher.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">5. Acceptable use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
                  <li>Violate applicable law or third-party rights;</li>
                  <li>Upload malware, probe or test vulnerabilities, or interfere with the Service or its users;</li>
                  <li>Scrape, data-mine, or use automated means to access the Service except as we expressly permit;</li>
                  <li>Harass, abuse, or post unlawful, defamatory, or infringing content;</li>
                  <li>Attempt to gain unauthorised access to accounts, systems, or data.</li>
                </ul>
                <p>We may suspend or terminate access for breach of these Terms or where necessary to protect the Service.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">6. User content</h2>
                <p>
                  You retain rights in content you submit. You grant us a worldwide, non-exclusive licence to host,
                  store, reproduce, and display your content solely to operate and improve the Service. You represent
                  that you have the rights needed to grant this licence.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">7. Intellectual property</h2>
                <p>
                  The Service, including software, branding, and design, is owned by {COMPANY_NAME} or its licensors.
                  Except as expressly allowed, you may not copy, modify, distribute, or create derivative works from
                  our materials.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">8. Third-party services</h2>
                <p>
                  The Service may integrate or link to third-party services (for example analytics or authentication
                  providers). Those services are governed by their own terms and privacy notices; we are not
                  responsible for third-party content or practices.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">9. Disclaimers</h2>
                <p>
                  The Service is provided on an “as is” and “as available” basis. To the fullest extent permitted by
                  law, we disclaim all warranties, whether express, implied, or statutory, including merchantability,
                  fitness for a particular purpose, and non-infringement. We do not warrant uninterrupted or
                  error-free operation.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">10. Limitation of liability</h2>
                <p>
                  Nothing in these Terms excludes or limits liability that cannot be excluded or limited under
                  applicable law, including liability for death or personal injury caused by negligence or fraud.
                  Subject to that, to the fullest extent permitted by law, we are not liable for any indirect,
                  incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill.
                  Our total liability for any claim arising out of or relating to the Service is limited to the greater
                  of £100 or the amounts you paid us for the Service in the twelve months before the claim (if any).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">11. Indemnity</h2>
                <p>
                  You will defend and indemnify {COMPANY_NAME} and its directors, officers, and employees against
                  claims, damages, losses, and expenses (including reasonable legal fees) arising from your use of the
                  Service, your content, or your breach of these Terms, to the extent permitted by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">12. Changes</h2>
                <p>
                  We may update these Terms by posting a revised version on this page and updating the “Last updated”
                  date. Continued use after changes constitutes acceptance of the revised Terms where permitted by law.
                  Material changes may be communicated by email or in-app notice where appropriate.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">13. Governing law and jurisdiction</h2>
                <p>
                  These Terms are governed by the laws of England and Wales. The courts of England and Wales have
                  exclusive jurisdiction to resolve disputes arising from or relating to these Terms or the Service,
                  subject to any mandatory rights you may have as a consumer in your country of residence.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">14. Contact</h2>
                <p>
                  Questions about these Terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </p>
              </section>

              <footer className="pt-8 border-t border-white/10 mt-10">
                <p className="text-xs text-muted-foreground">
                  See also our{" "}
                  <Link to="/privacy-policy" className="text-white/50 hover:text-white/70 transition-colors underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </footer>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
