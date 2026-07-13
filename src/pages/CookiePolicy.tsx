import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { SUPPORT_EMAIL } from "@/lib/appConfig";

export default function CookiePolicy() {
  const path = "/cookie-policy";
  const title = `Cookie & Storage Policy | ${COMPANY_NAME}`;
  const description = `How ${COMPANY_NAME} uses browser local storage, session storage, and similar technologies.`;

  return (
    <>
      <PageMeta title={title} description={description} path={path} />
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <article className="mx-auto max-w-3xl">
            <header className="mb-10 border-b border-white/10 pb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Cookie &amp; Storage Policy
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Last updated: 26 June 2026
              </p>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-foreground/90 [&_a]:text-white/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white [&_code]:text-foreground/80 [&_strong]:text-foreground">
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  1. Introduction
                </h2>
                <p>
                  This Cookie &amp; Storage Policy explains how {COMPANY_NAME}{" "}
                  (“we”, “us”, “our”) uses cookies, browser local storage,
                  session storage, and similar technologies when you use our
                  website and web application at{" "}
                  <a href={SITE_ORIGIN}>
                    {SITE_ORIGIN.replace(/^https:\/\//, "")}
                  </a>
                  , including when accessed via our Capacitor mobile shell. It
                  should be read with our{" "}
                  <Link to="/privacy-policy">Privacy Policy</Link>.
                </p>
                <p>
                  <strong>Current implementation note:</strong> authentication and
                  preferences use browser storage APIs and HTTP authorization
                  headers. We set one first-party HttpOnly cookie (
                  <code>apex_discussion_anon</code>) to bind anonymous community
                  discussion view counts to your browser.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  2. What we use instead of cookies
                </h2>
                <p>
                  The Service uses <strong>local storage</strong> and{" "}
                  <strong>session storage</strong> in your browser (or Capacitor
                  WebView) to persist authentication tokens, preferences, and
                  lightweight UI state. These technologies are functionally
                  similar to cookies in that data persists on your device, but
                  they are not transmitted automatically with every HTTP request
                  unless our JavaScript reads them and attaches values to API
                  calls.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  3. Storage keys we use
                </h2>

                <h3 className="font-medium text-foreground">
                  3.1 Strictly necessary (authentication and security)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-2 pr-4 font-semibold">Key</th>
                        <th className="py-2 pr-4 font-semibold">Storage</th>
                        <th className="py-2 font-semibold">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground/90">
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_discussion_anon</code>
                        </td>
                        <td className="py-2 pr-4">HttpOnly cookie</td>
                        <td className="py-2">
                          Server-issued anonymous viewer ID for community
                          discussion view deduplication (sent automatically on
                          view API requests; not readable by page JavaScript)
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_token</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          JWT access token sent as{" "}
                          <code>Authorization: Bearer</code>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_session_token</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Server auth session ID sent as{" "}
                          <code>X-Apex-Session</code>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_refresh_token</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Optional refresh token for silent session renewal
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_device_id</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Random UUID identifying this browser/installation;
                          sent as <code>X-Apex-Device-Id</code>
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_verify_email</code>
                        </td>
                        <td className="py-2 pr-4">sessionStorage</td>
                        <td className="py-2">
                          Temporary email address during email verification flow
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_token_admin</code>,{" "}
                          <code>apex_session_token_admin</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Admin session backup during support impersonation
                          (admin users only)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="font-medium text-foreground">
                  3.2 Functional (preferences and UI state)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-2 pr-4 font-semibold">Key</th>
                        <th className="py-2 pr-4 font-semibold">Storage</th>
                        <th className="py-2 font-semibold">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground/90">
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_settings</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Cached notification and privacy preferences (synced
                          with server when signed in)
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_onboarded</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Whether first-visit Sessions page onboarding was
                          dismissed
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_admin_sidebar_collapsed</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Admin dashboard sidebar collapsed state
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_discussion_anon_viewer</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Anonymous viewer ID for community discussion views
                          (client-side; used for identity merge when signing in)
                        </td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 pr-4">
                          <code>apex_discussion_viewed</code>
                        </td>
                        <td className="py-2 pr-4">localStorage</td>
                        <td className="py-2">
                          Capped list of discussion IDs already counted in this
                          browser (avoids duplicate view requests on refresh)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="font-medium text-foreground">
                  3.3 Theme preference
                </h3>
                <p>
                  The Service currently uses a fixed dark theme applied on load.
                  We do not persist a theme toggle in local storage at this
                  time.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  4. Capacitor mobile app
                </h2>
                <p>
                  Our iOS and Android builds use a Capacitor WebView that shares
                  the same local storage keys as the web application. We do not
                  use Capacitor Preferences or native secure storage plugins for
                  authentication at this time. Signing out clears authentication
                  keys from WebView storage.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  5. Apex Agent desktop storage
                </h2>
                <p>
                  The Apex Agent (documented in our <Link to="/eula">EULA</Link>
                  ) stores data in your operating system’s application data
                  directory, not in browser storage:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
                  <li>
                    <code>token.json</code> — access JWT, optional refresh
                    token, and server session token (<code>X-Apex-Session</code>
                    );
                  </li>
                  <li>
                    <code>apex_client_device_id.txt</code> — installation UUID
                    sent as <code>X-Apex-Device-Id</code>;
                  </li>
                  <li>
                    <code>pro_state.json</code> — cached Pro entitlement
                    requirement state.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  6. Third-party cookies
                </h2>
                <p>
                  When you complete a Pro subscription checkout or open the
                  billing portal, RevenueCat and Stripe may set their own
                  cookies or use storage on their domains. We do not control
                  those technologies; refer to{" "}
                  <a
                    href="https://www.revenuecat.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    RevenueCat’s privacy notice
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://stripe.com/gb/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Stripe’s privacy notice
                  </a>
                  .
                </p>
                <p>
                  We do not currently integrate Google Analytics or similar
                  third-party analytics cookies in the web application codebase.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  7. Legal basis (UK GDPR / PECR)
                </h2>
                <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
                  <li>
                    <strong>Strictly necessary storage:</strong> required to
                    provide the Service you request (authentication, security,
                    verification flows) — legitimate interests and/or contract.
                  </li>
                  <li>
                    <strong>Functional storage:</strong> preferences and UI
                    state — legitimate interests; where consent is required
                    under PECR for non-essential storage, we will obtain it
                    before use.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  8. How to control storage
                </h2>
                <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
                  <li>
                    <strong>Sign out:</strong> removes authentication tokens
                    from local storage via the app’s sign-out flow.
                  </li>
                  <li>
                    <strong>Browser settings:</strong> you can clear local
                    storage and session storage through your browser or device
                    settings. Clearing auth keys will sign you out and may reset
                    UI preferences.
                  </li>
                  <li>
                    <strong>Agent:</strong> sign out from the Agent tray menu or
                    delete the Agent’s application data folder to remove locally
                    stored tokens.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  9. Changes
                </h2>
                <p>
                  We may update this policy when we add new storage keys,
                  introduce cookies, or change third-party integrations. We will
                  update the “Last updated” date and, where required, seek
                  consent for new non-essential technologies.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">
                  10. Contact
                </h2>
                <p>
                  Questions:{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </p>
              </section>

              <footer className="mt-10 border-t border-white/10 pt-8">
                <p className="text-xs text-muted-foreground">
                  See also{" "}
                  <Link
                    to="/privacy-policy"
                    className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70"
                  >
                    Privacy Policy
                  </Link>
                  ,{" "}
                  <Link
                    to="/terms-and-conditions"
                    className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70"
                  >
                    Terms &amp; Conditions
                  </Link>
                  , and{" "}
                  <Link
                    to="/eula"
                    className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70"
                  >
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
