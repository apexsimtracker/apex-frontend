import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { SUPPORT_EMAIL } from "@/lib/appConfig";

const COOKIE_V2_PATH = "/v2/cookie-policy";
const title = `Cookie & Storage Policy | ${COMPANY_NAME}`;
const description = `How ${COMPANY_NAME} uses browser local storage, session storage, and similar technologies.`;

const linkClassName =
  "text-v2-primary transition-colors hover:text-v2-primary/80";

const codeClassName =
  "rounded-v2-sm bg-v2-surface-container px-1 py-0.5 font-mono text-xs text-v2-on-surface";

const bodyClassName =
  "font-v2-body text-sm leading-relaxed text-v2-on-surface-variant";

const listClassName =
  "list-disc space-y-1.5 pl-5 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant";

const h2ClassName = "font-v2-headline text-lg font-semibold text-v2-on-surface";

const h3ClassName = "font-v2-headline text-sm font-semibold text-v2-on-surface";

export default function CookiePolicyV2() {
  return (
    <>
      <PageMeta title={title} description={description} path={COOKIE_V2_PATH} />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <article className="mx-auto w-full max-w-3xl">
          <header className="mb-10 border-b border-v2-outline-variant/15 pb-8">
            <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
              Cookie &amp; Storage Policy
            </h1>
            <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
              Last updated: 26 June 2026
            </p>
          </header>

          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className={h2ClassName}>1. Introduction</h2>
              <p className={bodyClassName}>
                This Cookie &amp; Storage Policy explains how {COMPANY_NAME}{" "}
                (“we”, “us”, “our”) uses cookies, browser local storage, session
                storage, and similar technologies when you use our website and
                web application at{" "}
                <a href={SITE_ORIGIN} className={linkClassName}>
                  {SITE_ORIGIN.replace(/^https:\/\//, "")}
                </a>
                , including when accessed via our Capacitor mobile shell. It
                should be read with our{" "}
                <Link to="/privacy-policy" className={linkClassName}>
                  Privacy Policy
                </Link>
                .
              </p>
              <p className={bodyClassName}>
                <strong className="text-v2-on-surface">
                  Current implementation note:
                </strong>{" "}
                we do not set first-party HTTP cookies for authentication or
                preferences in the web application. Session state is maintained
                using browser storage APIs and HTTP authorization headers
                instead.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>2. What we use instead of cookies</h2>
              <p className={bodyClassName}>
                The Service uses{" "}
                <strong className="text-v2-on-surface">local storage</strong>{" "}
                and{" "}
                <strong className="text-v2-on-surface">session storage</strong>{" "}
                in your browser (or Capacitor WebView) to persist authentication
                tokens, preferences, and lightweight UI state. These
                technologies are functionally similar to cookies in that data
                persists on your device, but they are not transmitted
                automatically with every HTTP request unless our JavaScript
                reads them and attaches values to API calls.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>3. Storage keys we use</h2>

              <h3 className={h3ClassName}>
                3.1 Strictly necessary (authentication and security)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left font-v2-body text-xs">
                  <thead>
                    <tr className="border-b border-v2-outline-variant/15">
                      <th className="py-2 pr-4 font-v2-headline font-semibold text-v2-on-surface">
                        Key
                      </th>
                      <th className="py-2 pr-4 font-v2-headline font-semibold text-v2-on-surface">
                        Storage
                      </th>
                      <th className="py-2 font-v2-headline font-semibold text-v2-on-surface">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>apex_token</code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        JWT access token sent as{" "}
                        <code className={codeClassName}>
                          Authorization: Bearer
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>
                          apex_session_token
                        </code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Server auth session ID sent as{" "}
                        <code className={codeClassName}>X-Apex-Session</code>
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>
                          apex_refresh_token
                        </code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Optional refresh token for silent session renewal
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>apex_device_id</code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Random UUID identifying this browser/installation; sent
                        as{" "}
                        <code className={codeClassName}>X-Apex-Device-Id</code>
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>apex_verify_email</code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        sessionStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Temporary email address during email verification flow
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>apex_token_admin</code>,{" "}
                        <code className={codeClassName}>
                          apex_session_token_admin
                        </code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Admin session backup during support impersonation (admin
                        users only)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className={h3ClassName}>
                3.2 Functional (preferences and UI state)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left font-v2-body text-xs">
                  <thead>
                    <tr className="border-b border-v2-outline-variant/15">
                      <th className="py-2 pr-4 font-v2-headline font-semibold text-v2-on-surface">
                        Key
                      </th>
                      <th className="py-2 pr-4 font-v2-headline font-semibold text-v2-on-surface">
                        Storage
                      </th>
                      <th className="py-2 font-v2-headline font-semibold text-v2-on-surface">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>apex_settings</code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Cached notification and privacy preferences (synced with
                        server when signed in)
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>apex_onboarded</code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Whether first-visit Sessions page onboarding was
                        dismissed
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>
                          apex_admin_sidebar_collapsed
                        </code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Admin dashboard sidebar collapsed state
                      </td>
                    </tr>
                    <tr className="border-b border-v2-outline-variant/10">
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        <code className={codeClassName}>
                          apex_discussion_anon_viewer
                        </code>
                      </td>
                      <td className="py-2 pr-4 text-v2-on-surface-variant">
                        localStorage
                      </td>
                      <td className="py-2 text-v2-on-surface-variant">
                        Anonymous viewer ID for unauthenticated community
                        discussion views
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className={h3ClassName}>3.3 Theme preference</h3>
              <p className={bodyClassName}>
                The Service currently uses a fixed dark theme applied on load.
                We do not persist a theme toggle in local storage at this time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>4. Capacitor mobile app</h2>
              <p className={bodyClassName}>
                Our iOS and Android builds use a Capacitor WebView that shares
                the same local storage keys as the web application. We do not
                use Capacitor Preferences or native secure storage plugins for
                authentication at this time. Signing out clears authentication
                keys from WebView storage.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>5. Apex Agent desktop storage</h2>
              <p className={bodyClassName}>
                The Apex Agent (documented in our{" "}
                <Link to="/eula" className={linkClassName}>
                  EULA
                </Link>
                ) stores data in your operating system’s application data
                directory, not in browser storage:
              </p>
              <ul className={listClassName}>
                <li>
                  <code className={codeClassName}>token.json</code> — access
                  JWT, optional refresh token, and server session token (
                  <code className={codeClassName}>X-Apex-Session</code>);
                </li>
                <li>
                  <code className={codeClassName}>
                    apex_client_device_id.txt
                  </code>{" "}
                  — installation UUID sent as{" "}
                  <code className={codeClassName}>X-Apex-Device-Id</code>;
                </li>
                <li>
                  <code className={codeClassName}>pro_state.json</code> — cached
                  Pro entitlement requirement state.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>6. Third-party cookies</h2>
              <p className={bodyClassName}>
                When you complete a Pro subscription checkout or open the
                billing portal, RevenueCat and Stripe may set their own cookies
                or use storage on their domains. We do not control those
                technologies; refer to{" "}
                <a
                  href="https://www.revenuecat.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  RevenueCat’s privacy notice
                </a>{" "}
                and{" "}
                <a
                  href="https://stripe.com/gb/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  Stripe’s privacy notice
                </a>
                .
              </p>
              <p className={bodyClassName}>
                We do not currently integrate Google Analytics or similar
                third-party analytics cookies in the web application codebase.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>7. Legal basis (UK GDPR / PECR)</h2>
              <ul className={listClassName}>
                <li>
                  <strong className="text-v2-on-surface">
                    Strictly necessary storage:
                  </strong>{" "}
                  required to provide the Service you request (authentication,
                  security, verification flows) — legitimate interests and/or
                  contract.
                </li>
                <li>
                  <strong className="text-v2-on-surface">
                    Functional storage:
                  </strong>{" "}
                  preferences and UI state — legitimate interests; where consent
                  is required under PECR for non-essential storage, we will
                  obtain it before use.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>8. How to control storage</h2>
              <ul className={listClassName}>
                <li>
                  <strong className="text-v2-on-surface">Sign out:</strong>{" "}
                  removes authentication tokens from local storage via the app’s
                  sign-out flow.
                </li>
                <li>
                  <strong className="text-v2-on-surface">
                    Browser settings:
                  </strong>{" "}
                  you can clear local storage and session storage through your
                  browser or device settings. Clearing auth keys will sign you
                  out and may reset UI preferences.
                </li>
                <li>
                  <strong className="text-v2-on-surface">Agent:</strong> sign
                  out from the Agent tray menu or delete the Agent’s application
                  data folder to remove locally stored tokens.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>9. Changes</h2>
              <p className={bodyClassName}>
                We may update this policy when we add new storage keys,
                introduce cookies, or change third-party integrations. We will
                update the “Last updated” date and, where required, seek consent
                for new non-essential technologies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className={h2ClassName}>10. Contact</h2>
              <p className={bodyClassName}>
                Questions:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClassName}>
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </section>

            <footer className="mt-10 border-t border-v2-outline-variant/15 pt-8">
              <p className="font-v2-body text-xs text-v2-on-surface-variant">
                See also{" "}
                <Link to="/privacy-policy" className={linkClassName}>
                  Privacy Policy
                </Link>
                ,{" "}
                <Link to="/terms-and-conditions" className={linkClassName}>
                  Terms &amp; Conditions
                </Link>
                , and{" "}
                <Link to="/eula" className={linkClassName}>
                  EULA
                </Link>
                .
              </p>
            </footer>
          </div>
        </article>
      </div>
    </>
  );
}
