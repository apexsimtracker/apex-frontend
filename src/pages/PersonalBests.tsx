import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { ProUpgradeCallout } from "@/components/marketing/ProUpgradeCallout";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { BRAND_RED } from "@/lib/appConfig";
import { formatLapMs, formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { getPersonalBests, isProRequiredError } from "@/lib/api";
import { useIsProUser } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";

const PATH = "/personal-bests";
const title = `Personal bests | ${COMPANY_NAME}`;
const description = `Track your best qualifying laps per track and car on ${COMPANY_NAME}.`;

export default function PersonalBests() {
  const isPro = useIsProUser();

  const { data, isPending, error } = useQuery({
    queryKey: ["personal-bests"],
    queryFn: getPersonalBests,
    enabled: isPro,
    retry: (count, err) => !(err instanceof ApiError && err.status === 403) && count < 1,
  });

  const locked =
    !isPro ||
    (error instanceof ApiError && error.status === 403) ||
    isProRequiredError(error);

  return (
    <>
      <PageMeta title={title} description={description} path={PATH} noindex />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-start gap-3">
          <Trophy
            className="mt-1 size-8 shrink-0"
            style={{ color: BRAND_RED }}
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Personal bests
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your fastest qualifying laps by track and car, updated automatically from telemetry
              uploads.
            </p>
          </div>
        </div>

        {locked ? (
          <div className="mt-10">
            <ProUpgradeCallout
              layout="card"
              description="Personal bests tracking is an Apex Pro feature. Upgrade to save and view your best laps across every track and car combination."
              ctaLabel="View Pro plans"
            />
          </div>
        ) : isPending ? (
          <div className="mt-10 flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error && !isProRequiredError(error) ? (
          <p className="mt-10 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
            {error instanceof Error ? error.message : "Could not load personal bests."}
          </p>
        ) : !data?.personalBests?.length ? (
          <div className="mt-10 rounded-xl border border-white/10 bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">No personal bests recorded yet.</p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Upload a qualifying session with sector data to start tracking PBs.
            </p>
            <Button asChild variant="outline" className="mt-6 border-white/15">
              <Link to="/upload">Upload session</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Car</th>
                  <th className="px-4 py-3 text-right">Best lap</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.personalBests.map((pb) => (
                  <tr key={pb.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-foreground">{formatTrackName(pb.track)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCarName(pb.car)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {pb.sessionId ? (
                        <Link
                          to={`/sessions/${pb.sessionId}`}
                          className="text-foreground hover:underline"
                        >
                          {formatLapMs(pb.bestLapMs)}
                        </Link>
                      ) : (
                        formatLapMs(pb.bestLapMs)
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                      {new Date(pb.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
