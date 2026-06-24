import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { SUPPORT_EMAIL } from "@/lib/appConfig";

export default function EULA() {
  const path = "/eula";
  const title = `End User License Agreement | ${COMPANY_NAME} Agent`;
  const description = `License terms for the ${COMPANY_NAME} Agent desktop application for Windows, macOS, and Linux.`;

  return (
    <>
      <PageMeta title={title} description={description} path={path} />
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <article className="mx-auto max-w-3xl">
            <header className="mb-10 border-b border-white/10 pb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                End User License Agreement (EULA)
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Apex Agent Desktop Application — Windows, macOS &amp; Linux
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Last updated: 23 June 2026
              </p>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-foreground/90 [&_a]:text-white/70 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white [&_code]:text-foreground/80 [&_strong]:text-foreground">
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">1. Agreement</h2>
                <p>
                  This End User License Agreement (“EULA”) is a legal agreement between you (“User”, “you”) and{" "}
                  {COMPANY_NAME} (“Licensor”, “we”, “us”, “our”) for the Apex Agent software application (“Agent”),
                  including any updates, documentation, and associated materials we provide. By downloading,
                  installing, or using the Agent, you agree to this EULA. If you do not agree, do not install or use
                  the Agent.
                </p>
                <p>
                  This EULA supplements our{" "}
                  <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> and{" "}
                  <Link to="/privacy-policy">Privacy Policy</Link>. In the event of conflict regarding the Agent
                  software itself, this EULA prevails for software-licence matters; our Terms &amp; Conditions prevail
                  for Service usage and subscriptions.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">2. Licence grant</h2>
                <p>
                  Subject to your compliance with this EULA and an active {COMPANY_NAME} account with valid Pro
                  entitlement where required, we grant you a limited, non-exclusive, non-transferable, revocable
                  licence to install and run one copy of the Agent on a single computer you own or control, solely to
                  upload sim racing session data to your {COMPANY_NAME} account as intended by the Service.
                </p>
                <p>
                  The Agent is licensed, not sold. We reserve all rights not expressly granted.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">3. System monitoring and transparency</h2>
                <p>
                  The Agent performs local monitoring of supported racing simulators to extract session summaries. You
                  acknowledge and consent to the following behaviours while the Agent is running:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
                  <li>
                    <strong>UDP listening (F1 25):</strong> binds to a local UDP port (default 20776) to receive
                    telemetry packets broadcast by the game on your machine or local network segment.
                  </li>
                  <li>
                    <strong>Filesystem monitoring:</strong> watches designated simulator telemetry directories for new
                    or updated files (for example iRacing <code>.ibt</code> or Le Mans Ultimate <code>.duckdb</code>
                    exports) and reads them in read-only or parse-only mode.
                  </li>
                  <li>
                    <strong>Configuration writes (iRacing):</strong> may write telemetry-enable flags to your local
                    iRacing <code>app.ini</code> to facilitate disk telemetry capture.
                  </li>
                  <li>
                    <strong>Network transmission:</strong> sends parsed session JSON to {COMPANY_NAME} servers over
                    HTTPS when you are signed in and entitled to upload. Raw simulator files are not uploaded.
                  </li>
                  <li>
                    <strong>Local persistence:</strong> stores authentication tokens, a device UUID, optional failed
                    upload payloads, and Pro-gating state in the Agent’s application data directory.
                  </li>
                </ul>
                <p>
                  The Agent does not transmit your computer hostname, hardware serial numbers, MAC addresses, or
                  keystrokes. Detailed data categories are described in our{" "}
                  <Link to="/privacy-policy">Privacy Policy</Link>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">4. Restrictions</h2>
                <p>You must not:</p>
                <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
                  <li>
                    Copy, modify, adapt, translate, or create derivative works of the Agent except as permitted by
                    applicable law;
                  </li>
                  <li>
                    Reverse engineer, decompile, disassemble, or attempt to derive source code from the Agent, except
                    where such restriction is prohibited by mandatory law;
                  </li>
                  <li>
                    Remove, alter, or obscure proprietary notices, labels, or digital rights management;
                  </li>
                  <li>
                    Rent, lease, lend, sell, sublicense, or distribute the Agent to third parties;
                  </li>
                  <li>
                    Use the Agent to intercept, collect, or transmit data you are not authorised to access;
                  </li>
                  <li>
                    Circumvent Pro-tier upload restrictions, authentication, or rate limits;
                  </li>
                  <li>
                    Use the Agent in any manner that violates simulator licence agreements, anti-cheat policies, or
                    applicable law.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">5. Pro subscription requirement</h2>
                <p>
                  Automated session uploads via the Agent require an active, non-delinquent Pro subscription as
                  determined by our RevenueCat/Stripe billing integration. If your subscription expires or payment
                  fails, upload functionality may be disabled and the Agent may cache a local “Pro required” state.
                  Continued use of the Agent for local monitoring without upload may be permitted at our discretion,
                  but upload features remain subject to current entitlement.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">6. Updates and support</h2>
                <p>
                  We may provide updates, patches, or replacements for the Agent. Updates may install automatically or
                  require manual download from {SITE_ORIGIN}. We are not obligated to provide maintenance, support, or
                  updates, but may do so at our discretion.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">7. Third-party software</h2>
                <p>
                  The Agent interacts with third-party simulator software and may include open-source components
                  subject to their respective licences. Simulator trademarks and content belong to their owners. Your
                  use of simulators remains governed by their terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">8. Disclaimer of warranties</h2>
                <p>
                  THE AGENT IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTY OF ANY KIND. TO THE FULLEST EXTENT
                  PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS
                  FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
                <p>
                  We do not warrant that the Agent will detect every session, parse every telemetry file without error,
                  remain compatible with all simulator versions, operate without interruption, or meet your performance
                  expectations. Simulator updates may break Agent functionality until we release a compatible version.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">9. Limitation of liability</h2>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF DATA, PROFITS, OR GOODWILL,
                  ARISING FROM YOUR USE OF OR INABILITY TO USE THE AGENT, EVEN IF ADVISED OF THE POSSIBILITY.
                </p>
                <p>
                  Nothing in this EULA excludes or limits liability that cannot be excluded or limited under applicable
                  law, including liability for death or personal injury caused by negligence or fraud. Subject to
                  that, our total aggregate liability under this EULA is limited to £100 or the amount you paid for Pro
                  subscription in the twelve months preceding the claim, whichever is greater.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">10. Termination</h2>
                <p>
                  This licence is effective until terminated. You may terminate by uninstalling the Agent and signing
                  out. We may terminate or suspend your licence immediately if you breach this EULA or our Terms &amp;
                  Conditions. Upon termination, you must cease use and uninstall the Agent. Sections that by nature
                  should survive (restrictions, disclaimers, limitation of liability) will survive termination.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">11. Export compliance</h2>
                <p>
                  You represent that you are not located in a country subject to UK, US, or EU embargo and are not
                  listed on any government prohibited-party list. You agree to comply with applicable export control
                  laws.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">12. Governing law</h2>
                <p>
                  This EULA is governed by the laws of England and Wales. The courts of England and Wales have
                  exclusive jurisdiction, subject to mandatory consumer rights in your country of residence.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">13. Contact</h2>
                <p>
                  Questions about this EULA: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </p>
              </section>

              <footer className="mt-10 border-t border-white/10 pt-8">
                <p className="text-xs text-muted-foreground">
                  See also{" "}
                  <Link to="/terms-and-conditions" className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70">
                    Terms &amp; Conditions
                  </Link>
                  ,{" "}
                  <Link to="/privacy-policy" className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link to="/cookie-policy" className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70">
                    Cookie &amp; Storage Policy
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
