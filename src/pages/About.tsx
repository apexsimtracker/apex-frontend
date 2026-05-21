import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Flag, Sparkles, Target } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { BRAND_RED } from "@/lib/appConfig";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PATH = "/about";

const SIMS = ["iRacing", "F1 25", "Le Mans Ultimate"] as const;

function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-card/50 p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export default function About() {
  const title = `About Us | ${COMPANY_NAME}`;
  const description = `Founded by professional racer Hugo Cook: ${COMPANY_NAME} unifies sim performance, telemetry, and insights in one place — built by a racer, for racers.`;

  return (
    <>
      <PageMeta title={title} description={description} path={PATH} />
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <header className="mb-10 text-center sm:mb-12">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
                About us
              </p>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Built by a racer.
                <span
                  className="block sm:inline sm:before:content-['\00a0']"
                  style={{ color: BRAND_RED }}
                >
                  Built for racers.
                </span>
              </h1>
            </header>

            <div className="flex flex-col gap-6">
              <SectionCard>
                <div
                  className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <Target className="size-6" aria-hidden />
                </div>
                <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-foreground">
                  The founder
                </h2>
                <p className="text-center text-sm font-medium text-foreground">Hugo Cook</p>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Founder · Professional racing driver
                </p>
                <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                  British GT Championship · Barwell Motorsport · #63 Lamborghini Huracán GT3 Evo2
                </p>
              </SectionCard>

              <SectionCard>
                <div
                  className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <Flag className="size-6" aria-hidden />
                </div>
                <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-foreground">
                  Our story
                </h2>
                <div className="mx-auto max-w-2xl space-y-4 text-center text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Apex Sim Tracker was founded by Hugo Cook — a professional racing driver competing in
                    the British GT Championship with Barwell Motorsport, driving the #63 Lamborghini
                    Huracán GT3 Evo2.
                  </p>
                  <p>
                    As a racing driver, Hugo understood better than anyone the role that sim racing plays
                    in modern motorsport preparation. But when it came to tracking performance across
                    multiple simulators, the tools simply didn&apos;t exist. Session data lived in scattered
                    spreadsheets, there was no way to spot trends across different sims, and no platform
                    that treated sim racing with the seriousness it deserved.
                  </p>
                  <p className="font-semibold text-foreground">So he built it.</p>
                  <p>
                    Apex Sim Tracker brings together everything a sim racer needs to understand and improve
                    their performance — session logging, detailed stats, telemetry, leaderboards, and
                    rule-based Apex Analysis coaching insights — all in one place, across every simulator you use.
                  </p>
                </div>
              </SectionCard>

              <SectionCard>
                <div
                  className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <Sparkles className="size-6" aria-hidden />
                </div>
                <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-foreground">
                  Our mission
                </h2>
                <div className="mx-auto max-w-2xl space-y-4 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
                  <p>
                    Sim racing is no longer just a hobby. It&apos;s how drivers train, how talent gets
                    discovered, and how a generation of racers is pushing the boundaries of what&apos;s
                    possible behind a wheel. We believe those drivers deserve professional-grade tools to
                    match their ambition.
                  </p>
                  <p className="font-medium text-foreground">
                    Our mission is simple: give every sim racer — from weekend warrior to esports
                    professional — the data and insights they need to find the limit and go beyond it.
                  </p>
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-foreground">
                  What makes us different
                </h2>
                <div className="mx-auto max-w-2xl space-y-4 text-center text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Most tracking tools are built around a single simulator. Apex is different.
                    Whether you&apos;re setting lap times on iRacing, chasing pole in F1 25, or pushing
                    through the corners of Le Mans Ultimate, your data lives in one place — comparable,
                    consistent, and always yours.
                  </p>
                  <p>
                    Apex was built from the inside — by someone who knows what it takes to go fast, and
                    what information actually matters when you&apos;re trying to get faster.
                  </p>
                </div>
              </SectionCard>

              <section className="text-center">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
                  One place for every sim
                </h2>
                <p className="mx-auto mb-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Compare and track progress across the titles you already run — no more siloed
                  spreadsheets.
                </p>
                <ul className="flex flex-wrap items-center justify-center gap-2">
                  {SIMS.map((name) => (
                    <li
                      key={name}
                      className="rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </section>

              <div className="rounded-xl border border-white/10 bg-card/50 p-5 text-center sm:p-6">
                <p className="text-sm font-medium text-foreground">Have questions about Apex?</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Plans, sessions, Apex Pro, and more — we&apos;ve answered the common ones in our FAQ.
                </p>
                <Button asChild className="mt-5 text-white focus-visible:ring-ring" style={{ backgroundColor: BRAND_RED }}>
                  <Link to="/faq">Read the FAQ</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
