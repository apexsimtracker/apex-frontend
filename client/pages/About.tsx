import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { Eye, Lightbulb, ShieldCheck } from "lucide-react";

const PATH = "/about";

const TEAM_PLACEHOLDERS = [
  { name: "Alex Morgan", role: "Co-founder & Product" },
  { name: "Jordan Lee", role: "Engineering" },
  { name: "Sam Rivera", role: "Design & UX" },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (a && b) return (a + b).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "—";
}

export default function About() {
  const title = `About Us | ${COMPANY_NAME}`;
  const description = `Learn why ${COMPANY_NAME} exists: sim telemetry, progress tracking, and community for drivers at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

  return (
    <>
      <PageMeta title={title} description={description} path={PATH} />
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Mission */}
          <header className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Our mission
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Make sim telemetry actionable—one place to track laps, see progress, and connect with
              other drivers.
            </h1>
            <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {COMPANY_NAME} turns session data into a clear story: what you drove, how you improved,
              and how you stack up—without losing the community that makes sim racing worth it.
            </p>
          </header>

          {/* The problem we solve */}
          <section className="mb-14 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-6">
              The problem we solve
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                  Telemetry and results are scattered across files, forums, and spreadsheets. You
                  know you’re getting faster—but proving it, sharing it, and comparing it fairly is
                  harder than it should be.
                </p>
                <p>
                  Drivers need structured session history, social proof, and lightweight
                  competition—without leaving the workflow they already use to race and practice.
                </p>
              </div>
              <ul className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-5 space-y-3 text-sm text-foreground/90">
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">→</span>
                  <span>Fragmented lap files and screenshots instead of a single timeline you own.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">→</span>
                  <span>Hard to show progress to teammates, coaches, or friends in one place.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-semibold shrink-0">→</span>
                  <span>Leagues and challenges need trustworthy data—not manual copy-paste.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Our story — prose */}
          <section className="mb-14 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-6 text-center sm:text-left max-w-3xl mx-auto lg:mx-0">
              Our story
            </h2>
            <div
              className="prose prose-invert max-w-3xl mx-auto prose-headings:font-semibold prose-headings:tracking-tight prose-h3:text-lg prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground"
            >
              <p>
                {COMPANY_NAME} began as an MVP built for sim racers who live in telemetry: upload
                session data, see it in a feed, and build a profile that reflects real track time—not
                just a highlight reel.
              </p>
              <p>
                We focused on the essentials first: reliable ingestion, clear session detail, and
                spaces for community and competition—leaderboards and challenges—so progress could be
                social, not siloed.
              </p>
              <p>
                Today we’re still shipping toward the same north star:{" "}
                <strong>respect the driver’s time</strong>, make stats honest and easy to read, and
                keep improving the product every season—same as you on track.
              </p>
            </div>
          </section>

          {/* Core values */}
          <section className="mb-14 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-8 text-center">
              Core values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-primary">
                  <Lightbulb className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We build tools that match how sim racers actually train—from uploads to insights—not
                  generic dashboards bolted on after the fact.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-primary">
                  <Eye className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Transparency</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You should understand what the app shows and why—clear session context, honest
                  comparisons, and no mystery metrics.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-primary">
                  <ShieldCheck className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Reliability</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you trust us with your session data, we treat uptime, consistency, and security
                  as non-negotiable—same discipline as a race weekend.
                </p>
              </div>
            </div>
          </section>

          {/* Team */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-8 text-center">
              Our team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {TEAM_PLACEHOLDERS.map((member) => (
                <div
                  key={member.name}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col items-center text-center"
                >
                  <div
                    className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-foreground/90 border border-white/10 mb-4"
                    aria-hidden
                  >
                    {initials(member.name)}
                  </div>
                  <p className="font-semibold text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
