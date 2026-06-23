import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { SUPPORT_EMAIL } from "@/lib/appConfig";

export default function TermsAndConditions() {
  const path = "/terms-and-conditions";
  const title = `Terms & Conditions | ${COMPANY_NAME}`;
  const description = `Terms and conditions for using the ${COMPANY_NAME} sim racing platform, Apex Agent, and Pro subscription.`;

  return (
    <>
      <PageMeta title={title} description={description} path={path} />
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <article className="mx-auto max-w-3xl">
            <header className="mb-10 border-b border-white/10 pb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Terms &amp; Conditions
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Last updated: 23 June 2026
              </p>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-foreground/90 [&_a]:text-white/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white [&_strong]:text-foreground">
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">1. Agreement</h2>
                <p>
                  These Terms &amp; Conditions (“Terms”) govern your access to and use of the website, web
                  application, Capacitor mobile app, and Apex Agent desktop software operated by {COMPANY_NAME}
                  (“we”, “us”, “our”) at{" "}
                  <a href={SITE_ORIGIN}>{SITE_ORIGIN.replace(/^https:\/\//, "")}</a> (together, the “Service”). By
                  accessing or using the Service, you agree to these Terms. If you do not agree, do not use the
                  Service.
                </p>
                <p>
                  Use of the Apex Agent desktop application is also subject to our{" "}
                  <Link to="/eula">End User License Agreement (EULA)</Link>. Our{" "}
                  <Link to="/privacy-policy">Privacy Policy</Link> describes how we process personal data.
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
                  {COMPANY_NAME} provides online tools for sim racing session tracking, telemetry analysis,
                  community features, challenges, leaderboards, and related functionality. The Apex Agent is an
                  optional desktop background application that monitors supported simulators locally and uploads
                  session summaries to your account when configured and authorised.
                </p>
                <p>
                  We may modify, suspend, or discontinue any part of the Service with reasonable notice where
                  practicable. Feature availability may depend on your subscription tier (see section 8).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">4. Accounts and eligibility</h2>
                <p>
                  You must provide accurate registration information and keep your credentials secure. You are
                  responsible for all activity under your account, including activity performed through the Apex
                  Agent when signed in with your credentials. You must be at least 13 years old to use the Service,
                  or the minimum age required in your country if higher.
                </p>
                <p>
                  You may link the Apex Agent to your account via login or pairing. You are responsible for ensuring
                  the Agent runs only on devices you control and that you sign out or uninstall the Agent when you no
                  longer wish it to upload data on your behalf.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">5. Acceptable use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
                  <li>Violate applicable law or third-party rights (including game publisher terms of use);</li>
                  <li>Upload malware, probe or test vulnerabilities, or interfere with the Service or its users;</li>
                  <li>
                    Scrape, data-mine, or use automated means to access the Service except as we expressly permit
                    (including via the documented Apex Agent upload API when authenticated);
                  </li>
                  <li>Harass, abuse, or post unlawful, defamatory, or infringing content;</li>
                  <li>Attempt to gain unauthorised access to accounts, systems, or data;</li>
                  <li>
                    Submit falsified, manipulated, or third-party telemetry data as your own performance records;
                  </li>
                  <li>
                    Circumvent subscription checks, Pro-tier gates, rate limits, or other access controls.
                  </li>
                </ul>
                <p>We may suspend or terminate access for breach of these Terms or where necessary to protect the Service.</p>

                <h3 className="font-medium text-foreground">5.1 Automated telemetry infrastructure</h3>
                <p>
                  When you install and run the Apex Agent, you authorise it to:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
                  <li>
                    Listen on local network interfaces for supported simulator telemetry (for example F1 25 UDP on
                    port 20776);
                  </li>
                  <li>
                    Read simulator-generated telemetry files from designated folders on your device (for example
                    iRacing <code className="text-foreground/80">.ibt</code> files or Le Mans Ultimate{" "}
                    <code className="text-foreground/80">.duckdb</code> exports);
                  </li>
                  <li>
                    Parse, normalise, and transmit session summaries to our servers over HTTPS when you are
                    authenticated and entitled to use upload features;
                  </li>
                  <li>
                    Store authentication tokens and a device identifier locally in the Agent’s application data
                    directory.
                  </li>
                </ul>
                <p>
                  You must not use the Agent or any modified version to intercept telemetry you are not authorised to
                  collect, interfere with other users’ systems, or exfiltrate data beyond the scope of the Service.
                  You are responsible for compliance with your simulator’s licence terms and any applicable
                  anti-cheat or telemetry policies.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">6. User content</h2>
                <p>
                  You retain rights in content you submit, including session data, telemetry, posts, and comments.
                  You grant us a worldwide, non-exclusive licence to host, store, reproduce, process, analyse, and
                  display your content solely to operate and improve the Service (including telemetry charts, personal
                  bests, leaderboards, and community features). You represent that you have the rights needed to grant
                  this licence and that your content does not violate third-party rights.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">7. Intellectual property</h2>
                <p>
                  The Service, including software, branding, and design, is owned by {COMPANY_NAME} or its licensors.
                  Simulator names, tracks, and car data displayed in the Service may be trademarks of their
                  respective owners. Except as expressly allowed, you may not copy, modify, distribute, reverse
                  engineer, or create derivative works from our materials. Additional restrictions on the Apex Agent
                  are set out in the <Link to="/eula">EULA</Link>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">8. Subscriptions, Pro tier, and billing</h2>

                <h3 className="font-medium text-foreground">8.1 Free and Pro tiers</h3>
                <p>
                  The Service offers free and paid (“Pro”) tiers. Free-tier features may include limited session
                  history visibility (sessions older than 90 days may be inaccessible in the UI), restricted telemetry
                  analysis, and manual upload rate limits. Pro-tier features may include automated Agent uploads,
                  extended session history access, advanced telemetry charts, and other capabilities we designate as
                  Pro-only.
                </p>

                <h3 className="font-medium text-foreground">8.2 Subscription status and feature locks</h3>
                <p>
                  <strong>
                    Pro-tier and system feature locks are governed exclusively by your current, valid subscription
                    entitlement as evaluated by our billing infrastructure.
                  </strong>{" "}
                  We determine entitlement by synchronising subscription state from RevenueCat (our subscription
                  management provider), which in turn reflects payment status processed by Stripe. An active,
                  non-delinquent Pro subscription is required for Pro-gated features including, without limitation,
                  Apex Agent session uploads and certain telemetry analysis endpoints.
                </p>
                <p>
                  If your subscription lapses, is cancelled, enters a grace period, or becomes delinquent, Pro
                  features may be disabled immediately or after any applicable grace period communicated at checkout.
                  We are not liable for loss of access to Pro features resulting from expired or unpaid subscriptions.
                  You may restore access by renewing or updating your payment method through the billing portal
                  provided in Settings or on the Pricing page.
                </p>

                <h3 className="font-medium text-foreground">8.3 Billing terms</h3>
                <p>
                  Paid subscriptions are processed through RevenueCat and Stripe. By subscribing, you agree to
                  RevenueCat’s and Stripe’s applicable terms for checkout and payment. Prices, billing intervals,
                  and trial offers are displayed at purchase. Subscriptions renew automatically unless cancelled
                  before the renewal date through the billing self-service portal or as otherwise described at
                  checkout.
                </p>
                <p>
                  Refund eligibility is determined by applicable consumer law and the policies of our payment
                  processors. Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for billing support.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">9. Third-party services</h2>
                <p>
                  The Service integrates with third-party services including RevenueCat, Stripe, Cloudflare, email
                  providers, and simulator software. Those services are governed by their own terms and privacy
                  notices. We are not responsible for third-party content, simulator availability, or third-party
                  practices beyond our reasonable selection and contractual requirements of sub-processors.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">10. Disclaimers</h2>
                <p>
                  The Service is provided on an “as is” and “as available” basis. To the fullest extent permitted by
                  law, we disclaim all warranties, whether express, implied, or statutory, including merchantability,
                  fitness for a particular purpose, and non-infringement. We do not warrant uninterrupted or
                  error-free operation, accurate lap timing relative to official race control, or compatibility with
                  every simulator version or hardware configuration.
                </p>
                <p>
                  Telemetry data displayed in the Service is derived from simulator output and may contain errors,
                  omissions, or delays. Do not rely on the Service for safety-critical or commercial timing decisions.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">11. Limitation of liability</h2>
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
                <h2 className="text-base font-semibold text-foreground">12. Indemnity</h2>
                <p>
                  You will defend and indemnify {COMPANY_NAME} and its directors, officers, and employees against
                  claims, damages, losses, and expenses (including reasonable legal fees) arising from your use of the
                  Service, your content, your operation of the Apex Agent, or your breach of these Terms, to the extent
                  permitted by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">13. Termination</h2>
                <p>
                  You may stop using the Service at any time and delete your account in Settings. We may suspend or
                  terminate your access for breach of these Terms, non-payment, or to protect the Service. On
                  termination, your right to use the Service ceases; provisions that by their nature should survive
                  (including intellectual property, disclaimers, limitation of liability, and indemnity) will survive.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">14. Changes</h2>
                <p>
                  We may update these Terms by posting a revised version on this page and updating the “Last updated”
                  date. Continued use after changes constitutes acceptance of the revised Terms where permitted by
                  law. Material changes may be communicated by email or in-app notice where appropriate.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">15. Governing law and jurisdiction</h2>
                <p>
                  These Terms are governed by the laws of England and Wales. The courts of England and Wales have
                  exclusive jurisdiction to resolve disputes arising from or relating to these Terms or the Service,
                  subject to any mandatory rights you may have as a consumer in your country of residence.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">16. Contact</h2>
                <p>
                  Questions about these Terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </p>
              </section>

              <footer className="mt-10 border-t border-white/10 pt-8">
                <p className="text-xs text-muted-foreground">
                  See also{" "}
                  <Link to="/privacy-policy" className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70">
                    Privacy Policy
                  </Link>
                  ,{" "}
                  <Link to="/cookie-policy" className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70">
                    Cookie &amp; Storage Policy
                  </Link>
                  , and{" "}
                  <Link to="/eula" className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70">
                    EULA
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
