import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { SUPPORT_EMAIL } from "@/lib/appConfig";

export default function PrivacyPolicy() {
  const path = "/privacy-policy";
  const title = `Privacy Policy | ${COMPANY_NAME}`;
  const description = `How ${COMPANY_NAME} collects and uses personal data when you use ${SITE_ORIGIN.replace("https://", "")}.`;

  return (
    <>
      <PageMeta title={title} description={description} path={path} />
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <article className="max-w-3xl mx-auto">
            <header className="mb-10 border-b border-white/10 pb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Last updated: 4 April 2026
              </p>
            </header>

            <div className="space-y-8 text-sm text-foreground/90 leading-relaxed [&_strong]:text-foreground [&_a]:text-white/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white">
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">1. Introduction</h2>
                <p>
                  This Privacy Policy explains how {COMPANY_NAME} (“we”, “us”, “our”) processes personal data when you
                  visit or use our website and services at{" "}
                  <a href={SITE_ORIGIN}>{SITE_ORIGIN.replace(/^https:\/\//, "")}</a> (the “Service”). We respect your
                  privacy and process personal data in accordance with the UK General Data Protection Regulation (UK
                  GDPR), the Data Protection Act 2018, and related UK privacy laws.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">2. Data controller</h2>
                <p>
                  {COMPANY_NAME} is the data controller responsible for personal data described in this policy. Contact:{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">3. Data we collect</h2>
                <p>Depending on how you use the Service, we may process:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
                  <li>
                    <strong>Account and contact data:</strong> for example your email address and profile details you
                    choose to provide when you register or communicate with us.
                  </li>
                  <li>
                    <strong>Usage and technical data:</strong> such as pages viewed, approximate location derived from
                    IP, device and browser type, referring URLs, and timestamps. We use this to operate and improve
                    the Service and understand aggregate usage patterns.
                  </li>
                  <li>
                    <strong>Analytics data:</strong> we may use Google Analytics or similar tools to collect
                    aggregated statistics about how visitors use the Service (for example page views and events). These
                    providers may set cookies or use similar technologies as described below.
                  </li>
                  <li>
                    <strong>Cookies and similar technologies:</strong> we use cookies and local storage where
                    necessary for security, preferences, and analytics. See section 7.
                  </li>
                  <li>
                    <strong>Content you submit:</strong> for example session data, posts, or uploads you choose to
                    share through the Service.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">4. How we use your data</h2>
                <p>We use personal data to:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
                  <li>Provide, secure, and maintain the Service;</li>
                  <li>Create and manage your account and authenticate you;</li>
                  <li>Communicate with you about the Service, support requests, and important notices;</li>
                  <li>Analyse usage to improve features, performance, and user experience;</li>
                  <li>Comply with legal obligations and enforce our terms.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">5. Legal bases (UK GDPR)</h2>
                <p>We rely on one or more of the following legal bases:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
                  <li>
                    <strong>Contract:</strong> processing necessary to provide the Service you request (for example
                    account management).
                  </li>
                  <li>
                    <strong>Legitimate interests:</strong> for example improving the Service, security, fraud
                    prevention, and analytics, balanced against your rights.
                  </li>
                  <li>
                    <strong>Consent:</strong> where required (for example certain non-essential cookies or marketing
                    communications, if offered).
                  </li>
                  <li>
                    <strong>Legal obligation:</strong> where we must process data to comply with applicable law.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">6. Sharing and processors</h2>
                <p>
                  We may share personal data with trusted service providers who process data on our instructions
                  (processors), such as hosting, email delivery, and analytics providers. We require them to protect
                  your data appropriately. We may also disclose information if required by law, to protect rights and
                  safety, or in connection with a business transfer (for example a merger), subject to applicable law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">7. Cookies</h2>
                <p>
                  We use cookies and similar technologies for essential functions (for example security and session
                  management), preferences, and analytics (including Google Analytics where enabled). You can control
                  cookies through your browser settings; blocking some cookies may affect functionality. Where required,
                  we obtain consent for non-essential cookies in line with applicable guidance.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">8. International transfers</h2>
                <p>
                  If we transfer personal data outside the UK, we ensure appropriate safeguards (for example the UK
                  International Data Transfer Agreement / Addendum or adequacy regulations) as required by applicable
                  law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">9. Retention</h2>
                <p>
                  We retain personal data only as long as necessary for the purposes described in this policy, including
                  to meet legal, accounting, or reporting requirements. Retention periods vary depending on the data
                  type and context; for example account data is kept while your account is active and for a reasonable
                  period afterwards unless a longer period is required by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">10. Your rights</h2>
                <p>Under UK data protection law you may have the right to:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
                  <li>Access your personal data;</li>
                  <li>Rectify inaccurate data;</li>
                  <li>Erase data in certain circumstances;</li>
                  <li>Restrict or object to processing in certain circumstances;</li>
                  <li>Data portability where applicable;</li>
                  <li>Withdraw consent where processing is based on consent;</li>
                  <li>Lodge a complaint with the UK Information Commissioner’s Office (ICO) at{" "}
                    <a href="https://ico.org.uk/" target="_blank" rel="noopener noreferrer">
                      ico.org.uk
                    </a>
                    .
                  </li>
                </ul>
                <p>
                  To exercise your rights, contact us at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We may need to verify your identity.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">11. Security</h2>
                <p>
                  We implement appropriate technical and organisational measures designed to protect personal data.
                  No method of transmission or storage is completely secure; we encourage you to use a strong password
                  and protect your account credentials.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">12. Children</h2>
                <p>
                  The Service is not directed at children under 13, and we do not knowingly collect personal data from
                  children under 13. If you believe we have collected such data, please contact us and we will take
                  appropriate steps to delete it.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">13. Changes to this policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will post the revised policy on this page
                  and update the “Last updated” date. Where changes are material, we may provide additional notice
                  (for example by email or in-app).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">14. Contact</h2>
                <p>
                  For privacy enquiries: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </p>
              </section>

              <footer className="pt-8 border-t border-white/10 mt-10">
                <p className="text-xs text-muted-foreground">
                  See also our{" "}
                  <Link to="/terms-and-conditions" className="text-white/50 hover:text-white/70 transition-colors underline underline-offset-2">
                    Terms &amp; Conditions
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
