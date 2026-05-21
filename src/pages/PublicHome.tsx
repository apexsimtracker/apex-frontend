import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Bot,
  ChevronRight,
  Flag,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { BRAND_RED } from "@/lib/appConfig";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PATH = "/";

const SIMS = ["iRacing", "F1 25", "Le Mans Ultimate"] as const;

const PUBLIC_HOME_TITLE = `${COMPANY_NAME} — Sim racing performance hub`;
const PUBLIC_HOME_DESCRIPTION = `${COMPANY_NAME}: session logging, telemetry, leaderboards, challenges, community, and Apex Analysis coaching — one place for every sim you run.`;

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

export default function PublicHome() {
  return (
    <>
      <PageMeta
        title={PUBLIC_HOME_TITLE}
        description={PUBLIC_HOME_DESCRIPTION}
        path={PATH}
      />
      <div className="relative overflow-x-hidden bg-background">
        {/* Circular gradients - glow - left */}
        <div
          className="absolute top-0 left-0 top-auto h-[min(42vw,18rem)] w-[min(40vw,17rem)] -translate-x-1/4 translate-y-1/3 rounded-full opacity-[0.28] blur-[64px] sm:opacity-[0.32] lg:h-[22rem] lg:w-[20rem] lg:opacity-[0.38] lg:blur-[80px]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(234, 88, 12, 0.22) 0%, rgba(220, 38, 38, 0.12) 58%, transparent 75%)",
          }}
        />

        {/* Circular gradients - glow - right */}
        <div
          className="absolute top-0 right-0 top-auto h-[min(42vw,18rem)] w-[min(40vw,17rem)] translate-x-1/4 translate-y-1/3 rounded-full opacity-[0.28] blur-[64px] sm:opacity-[0.32] lg:h-[22rem] lg:w-[20rem] lg:opacity-[0.38] lg:blur-[80px]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(234, 88, 12, 0.22) 0%, rgba(220, 38, 38, 0.12) 58%, transparent 75%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          {/* Hero */}
          <section className="mx-auto max-w-4xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Sim racing performance hub
            </p>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Your data.
              <span
                className="block sm:inline sm:before:content-['\00a0']"
                style={{ color: BRAND_RED }}
              >
                One place.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Track sessions, compare across sims, join challenges, and learn from the community —
              built by a racer who needed professional-grade tools for modern prep.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="text-white focus-visible:ring-ring sm:min-w-[200px]"
                style={{ backgroundColor: BRAND_RED }}
              >
                <Link to="/signup">Create account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/15 bg-white/5 sm:min-w-[200px]">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </section>

          {/* Feature grid */}
          <section className="mx-auto mt-14 max-w-6xl sm:mt-16 lg:mt-20">
            <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-foreground">
              Everything in one hub
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground sm:mb-10">
              Sign in for your activity feed, weekly goals, uploads, and personalized stats — or browse
              what&apos;s happening on the track today.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SectionCard>
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <LayoutGrid className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">Activity feed & goals</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  See your sessions and weekly targets alongside the community — your home base when
                  you&apos;re logged in.
                </p>
              </SectionCard>
              <SectionCard>
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <BarChart3 className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">Sessions & stats</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Log performance and spot trends instead of scattering notes across spreadsheets.
                </p>
              </SectionCard>
              <SectionCard>
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <Trophy className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">Leaderboards</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Compare laps and climb the ranks — see where you stand against the field.
                </p>
              </SectionCard>
              <SectionCard>
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <Target className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">Challenges</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Enter events, qualify, and compete in structured sim racing challenges.
                </p>
              </SectionCard>
              <SectionCard>
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <MessageCircle className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">Community</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Discuss setups, events, and technique with other racers — jump into discussions
                  anytime.
                </p>
              </SectionCard>
              <SectionCard>
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <Bot className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground">Agent & Apex Pro</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Go deeper with telemetry uploads, Apex Agent, analytics, and Pro-only perks — upgrade
                  on Pricing when you are ready.
                </p>
              </SectionCard>
            </div>
          </section>

          {/* Browse CTAs */}
          <section className="mx-auto mt-12 max-w-3xl sm:mt-14">
            <SectionCard className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Explore without signing in
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Browse community, challenges, and leaderboards — create an account when
                    you&apos;re ready to track your own data.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:shrink-0">
                  <Button asChild variant="secondary" className="justify-between gap-2 border-white/10 bg-white/5">
                    <Link to="/community" className="flex w-full items-center justify-between">
                      Community
                      <ChevronRight className="size-4 opacity-70" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="justify-between gap-2 border-white/10 bg-white/5">
                    <Link to="/challenges" className="flex w-full items-center justify-between">
                      Challenges
                      <ChevronRight className="size-4 opacity-70" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="justify-between gap-2 border-white/10 bg-white/5">
                    <Link to="/leaderboards" className="flex w-full items-center justify-between">
                      Leaderboards
                      <ChevronRight className="size-4 opacity-70" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </SectionCard>
          </section>

          {/* Multi-sim */}
          <section className="mx-auto mt-12 max-w-3xl text-center sm:mt-14">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              One place for every sim
            </h2>
            <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Compare progress across the titles you already run — consistent data, not siloed
              sheets.
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

          {/* Founder */}
          <section className="mx-auto mt-12 max-w-3xl sm:mt-14">
            <SectionCard className="border-white/10 bg-card/40">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50"
                  style={{ color: BRAND_RED }}
                >
                  <Flag className="size-6" aria-hidden />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Built by a racer</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Founded by Hugo Cook — British GT with Barwell Motorsport. Apex exists because sim
                    prep deserved the same seriousness as real-world racing.
                  </p>
                  <Link
                    to="/about"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/90"
                  >
                    Our story
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </SectionCard>
          </section>

          {/* Pro teaser */}
          <section className="mx-auto mt-12 max-w-3xl sm:mt-14">
            <SectionCard>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border border-border bg-muted/50">
                <Sparkles className="size-6 text-amber-400/90" aria-hidden />
              </div>
              <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-foreground">
                Apex Pro
              </h2>
              <p className="mx-auto mb-6 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
                Automatic telemetry uploads, Apex Agent access, full analytics, and future Pro-only
                challenges — unlock after you join.
              </p>
              <ul className="mx-auto grid max-w-md gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <Upload className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden />
                  <span>Automatic telemetry uploads</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden />
                  <span>Apex Agent access</span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden />
                  <span>Full analytics & comparisons</span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden />
                  <span>Future Pro-only challenges</span>
                </li>
              </ul>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  className="text-white focus-visible:ring-ring"
                  style={{ backgroundColor: BRAND_RED }}
                >
                  <Link to="/signup">Get started</Link>
                </Button>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Link to="/login">Already have an account?</Link>
                </Button>
              </div>
            </SectionCard>
          </section>

          {/* FAQ + mission */}
          <section className="mx-auto mt-12 max-w-3xl sm:mt-14">
            <div className="grid gap-4 sm:grid-cols-2">
              <SectionCard className="flex flex-col justify-center">
                <Users className="mx-auto mb-3 size-8 text-foreground/80 sm:mx-0" aria-hidden />
                <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-foreground sm:text-left">
                  Questions?
                </h2>
                <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
                  Plans, sessions, Pro, and more — we&apos;ve collected answers in one place.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-5 border-white/15"
                >
                  <Link to="/faq">Read the FAQ</Link>
                </Button>
              </SectionCard>
              <SectionCard className="flex flex-col justify-center">
                <Sparkles className="mx-auto mb-3 size-8 text-foreground/80 sm:mx-0" aria-hidden />
                <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-foreground sm:text-left">
                  Mission
                </h2>
                <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
                  Give every sim racer — weekend warrior to esports pro — the insights they need to
                  find the limit and go beyond it.
                </p>
                <Button asChild variant="outline" className="mt-5 border-white/15">
                  <Link to="/about">About us</Link>
                </Button>
              </SectionCard>
            </div>
          </section>

          {/* Final CTA */}
          <section className="mx-auto mt-14 max-w-2xl rounded-xl border border-white/10 bg-card/50 p-8 text-center sm:mt-16 sm:p-10">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Ready to centralize your sim racing data?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Join {COMPANY_NAME} and turn scattered sessions into a clear picture of your pace.
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="text-white focus-visible:ring-ring"
                style={{ backgroundColor: BRAND_RED }}
              >
                <Link to="/signup">Sign up free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5">
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
