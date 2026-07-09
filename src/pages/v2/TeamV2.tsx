import { useState } from "react";
import { BadgeCheck, UserPlus } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import UserAvatar from "@/components/UserAvatar";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { usePlatform } from "@/hooks/usePlatform";
import { cn } from "@/lib/utils";

const TEAM_V2_PATH = "/v2/team";
const teamTitle = `Team | ${COMPANY_NAME}`;
const teamDescription = `Apex Racing team overview, members, and stats on ${COMPANY_NAME}.`;

// TODO(team-api): all data below is static placeholder content. Replace with
// real team data once the team backend endpoints exist. Do not invent APIs here.
const TEAM_LOGO_SRC = "/screens/img/apex-team-logo.png";

type TeamRole = "leader" | "admin" | "member";

type TeamMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
  sessions: number;
  laps: number;
  role: TeamRole;
};

type TeamStat = {
  label: string;
  value: string;
};

type ActivityBar = {
  day: string;
  heightPct: number;
  active?: boolean;
};

type TeamTab = {
  id: string;
  label: string;
};

const TEAM_TABS: TeamTab[] = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "activity", label: "Activity" },
  { id: "stats", label: "Stats" },
];

const HEADLINE_STATS: TeamStat[] = [
  { label: "Members", value: "5" },
  { label: "Laps Driven", value: "5,892" },
  { label: "Avg Finish", value: "4.2" },
];

const SECONDARY_STATS: TeamStat[] = [
  { label: "Races", value: "158" },
  { label: "Wins", value: "12" },
  { label: "Podiums", value: "31" },
];

const ACTIVITY_BARS: ActivityBar[] = [
  { day: "Mon", heightPct: 55 },
  { day: "Tue", heightPct: 35 },
  { day: "Wed", heightPct: 70 },
  { day: "Thu", heightPct: 45 },
  { day: "Fri", heightPct: 100, active: true },
  { day: "Sat", heightPct: 80 },
  { day: "Sun", heightPct: 60 },
];

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "max-verstappen",
    name: "Max Verstappen",
    avatarUrl: null,
    sessions: 122,
    laps: 1342,
    role: "leader",
  },
  {
    id: "lando-norris",
    name: "Lando Norris",
    avatarUrl: null,
    sessions: 98,
    laps: 1102,
    role: "admin",
  },
  {
    id: "charles-leclerc",
    name: "Charles Leclerc",
    avatarUrl: null,
    sessions: 86,
    laps: 942,
    role: "member",
  },
  {
    id: "oscar-piastri",
    name: "Oscar Piastri",
    avatarUrl: null,
    sessions: 74,
    laps: 821,
    role: "member",
  },
  {
    id: "george-russell",
    name: "George Russell",
    avatarUrl: null,
    sessions: 68,
    laps: 713,
    role: "member",
  },
];

const ROLE_BADGE_LABEL: Record<Exclude<TeamRole, "member">, string> = {
  leader: "LEADER",
  admin: "ADMIN",
};

function formatLaps(laps: number): string {
  return laps.toLocaleString("en-US");
}

function StatStrip({
  stats,
  valueClassName,
}: {
  stats: TeamStat[];
  valueClassName: string;
}) {
  return (
    <section className="flex items-stretch rounded-xl bg-v2-surface-container-low px-2 py-4">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex flex-1 items-stretch">
          {index > 0 && (
            <div className="w-px bg-v2-outline-variant/20" aria-hidden />
          )}
          <div className="flex-1 text-center">
            <p
              className={cn(
                "font-v2-headline font-bold text-v2-on-surface",
                valueClassName,
              )}
            >
              {stat.value}
            </p>
            <p className="mt-1 font-v2-body text-[9px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function TeamV2() {
  const { isWeb } = usePlatform();
  const [logoImgFailed, setLogoImgFailed] = useState(false);

  return (
    <>
      <PageMeta
        title={teamTitle}
        description={teamDescription}
        path={TEAM_V2_PATH}
      />
      <div className="relative mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col space-y-5 overflow-y-auto px-6 pb-10 pt-2">
        {/* Team identity */}
        <section className="flex flex-col items-center text-center">
          <div className="flex size-24 items-center justify-center rounded-2xl bg-v2-surface-container-low p-2 shadow-xl ring-1 ring-v2-outline-variant/20">
            {logoImgFailed ? (
              <span
                className="font-v2-headline text-2xl font-bold text-v2-primary"
                aria-hidden
              >
                AR
              </span>
            ) : (
              <img
                src={TEAM_LOGO_SRC}
                alt="Apex Racing logo"
                className="size-full object-contain"
                onError={() => setLogoImgFailed(true)}
              />
            )}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <h2 className="font-v2-headline text-2xl font-bold tracking-tight text-v2-on-surface">
              Apex Racing
            </h2>
            <BadgeCheck
              className="size-[18px] shrink-0 text-v2-primary"
              aria-label="Verified team"
            />
          </div>
          <div className="mt-1 flex items-center gap-2 font-v2-body text-[10px] font-semibold uppercase tracking-widest">
            <span className="text-v2-on-surface-variant">Est. May 2024</span>
            <span className="text-v2-outline-variant" aria-hidden>
              •
            </span>
            <span className="text-v2-primary">Rank #18</span>
          </div>
          <p className="mt-2 max-w-xs font-v2-body text-sm text-v2-on-surface-variant">
            Push limits. Chase speed. Leave everyone behind.
          </p>
          {/* TODO(team-api): wire invite flow once team membership backend exists. */}
          {isWeb && (
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-v2-primary py-3 font-v2-body text-sm font-bold text-white transition-colors hover:bg-v2-primary/90"
            >
              <UserPlus className="size-[18px] shrink-0" aria-hidden />
              Invite Members
            </button>
          )}
        </section>

        {/* Tabs (static — Overview active). TODO(team-api): enable tab switching. */}
        <section className="grid grid-cols-4 border-b border-v2-outline-variant/30">
          {TEAM_TABS.map((tab) => {
            const isActive = tab.id === "overview";
            return (
              <button
                key={tab.id}
                type="button"
                aria-disabled
                className={cn(
                  "py-3 font-v2-body text-xs font-bold uppercase tracking-widest transition-colors",
                  isActive
                    ? "border-b-2 border-v2-primary text-v2-on-surface"
                    : "text-v2-on-surface-variant",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </section>

        {/* Headline stats strip */}
        <StatStrip stats={HEADLINE_STATS} valueClassName="text-2xl" />

        {/* Team Activity chart (decorative static bars) */}
        <section className="rounded-xl bg-v2-surface-container-low p-4">
          <p className="mb-3 font-v2-body text-[10px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
            Team Activity
          </p>
          <div className="flex h-20 items-end justify-between gap-2">
            {ACTIVITY_BARS.map((bar) => (
              <div
                key={bar.day}
                className={cn(
                  "flex-1 rounded-t bg-v2-primary",
                  bar.active ? "opacity-100" : "opacity-40",
                )}
                style={{ height: `${bar.heightPct}%` }}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-v2-body text-[10px] font-semibold text-v2-on-surface-variant">
            {ACTIVITY_BARS.map((bar) => (
              <span key={bar.day} className="flex-1 text-center">
                {bar.day}
              </span>
            ))}
          </div>
        </section>

        {/* Secondary stats row */}
        <StatStrip stats={SECONDARY_STATS} valueClassName="text-lg" />

        {/* Members */}
        <section>
          <p className="mb-2 px-1 font-v2-body text-[10px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
            Members
          </p>
          <div className="divide-y divide-v2-outline-variant/20 rounded-xl bg-v2-surface-container-low">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3">
                <UserAvatar
                  name={member.name}
                  avatarUrl={member.avatarUrl}
                  size="md"
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-v2-body text-sm font-bold text-v2-on-surface">
                      {member.name}
                    </p>
                    {member.role !== "member" && (
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 font-v2-body text-[9px] font-bold",
                          member.role === "leader"
                            ? "bg-v2-primary text-white"
                            : "bg-v2-surface-container-highest text-v2-on-surface-variant",
                        )}
                      >
                        {ROLE_BADGE_LABEL[member.role]}
                      </span>
                    )}
                  </div>
                  <p className="font-v2-body text-[10px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
                    {member.sessions} sessions
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-v2-headline font-bold text-v2-on-surface">
                    {formatLaps(member.laps)}
                  </p>
                  <p className="font-v2-body text-[9px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
                    Laps
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Team Challenge */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="font-v2-body text-[10px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
              Upcoming Team Challenge
            </p>
            <span className="rounded bg-v2-primary px-1.5 py-0.5 font-v2-body text-[9px] font-bold text-white">
              NEW
            </span>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-v2-surface-container-low">
            <div className="h-28 w-full bg-gradient-to-br from-v2-primary/40 to-v2-surface-container">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(circle at 70% 40%, hsl(var(--v2-primary)) 0%, transparent 60%)",
                }}
                aria-hidden
              />
            </div>
            <div className="relative -mt-14 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-v2-headline text-lg font-bold text-v2-on-surface">
                    MOST LAPS CHALLENGE
                  </p>
                  <p className="mt-1 font-v2-body text-[11px] text-v2-on-surface-variant">
                    Complete the most laps as a team this week.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-v2-body text-[9px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
                    Ends In
                  </p>
                  <p className="font-v2-headline text-2xl font-bold text-v2-primary">
                    05
                    <span className="ml-1 font-v2-body text-xs font-medium text-v2-on-surface-variant">
                      d
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between font-v2-body text-[10px]">
                  <span className="font-bold text-v2-primary">
                    842 / 1,000 LAPS
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-v2-surface-container-highest">
                  <div
                    className="h-full rounded-full bg-v2-primary"
                    style={{ width: "84%" }}
                  />
                </div>
              </div>

              {/* TODO(team-api): link to real team challenge once backend exists. */}
              <button
                type="button"
                className="mt-4 w-full rounded-xl bg-v2-primary py-3 font-v2-body text-sm font-bold text-white transition-colors hover:bg-v2-primary/90"
              >
                VIEW CHALLENGE
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
