import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy, Zap } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { formatLapMs, formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { getPersonalBests, isProRequiredError } from "@/lib/api";
import { useIsProUser } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";

const PATH = "/personal-bests";
const title = `Personal bests | ${COMPANY_NAME}`;
const description = `Track your best qualifying laps per track and car on ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

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
      <PageMeta title={title} description={description} path={PATH} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-start gap-3">
          <Trophy className="mt-1 size-8 shrink-0 text-amber-500" />
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Personal bests</h1>
            <p className="mt-2 text-sm text-white/60">
              Your fastest qualifying laps by track and car, updated automatically from telemetry
              uploads.
            </p>
          </div>
        </div>

        {locked ? (
          <div className="mt-10 rounded-xl border border-amber-500/25 bg-amber-500/5 p-8 text-center">
            <p className="text-white/80">
              Personal bests tracking is an Apex Pro feature. Upgrade to save and view your best
              laps across every track and car combination.
            </p>
            <Button asChild className="mt-6 bg-amber-500 text-black hover:bg-amber-400">
              <Link to="/pricing">
                <Zap className="mr-2 size-4" />
                View Pro plans
              </Link>
            </Button>
          </div>
        ) : isPending ? (
          <div className="mt-10 flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-white/40" />
          </div>
        ) : error && !isProRequiredError(error) ? (
          <p className="mt-10 text-center text-sm text-red-400">
            {error instanceof Error ? error.message : "Could not load personal bests."}
          </p>
        ) : !data?.personalBests?.length ? (
          <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-white/70">No personal bests recorded yet.</p>
            <p className="mt-2 text-sm text-white/50">
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
                <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/50">
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Car</th>
                  <th className="px-4 py-3 text-right">Best lap</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.personalBests.map((pb) => (
                  <tr key={pb.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white">{formatTrackName(pb.track)}</td>
                    <td className="px-4 py-3 text-white/80">{formatCarName(pb.car)}</td>
                    <td className="px-4 py-3 text-right font-mono text-purple-300">
                      {pb.sessionId ? (
                        <Link
                          to={`/sessions/${pb.sessionId}`}
                          className="hover:text-purple-200 hover:underline"
                        >
                          {formatLapMs(pb.bestLapMs)}
                        </Link>
                      ) : (
                        formatLapMs(pb.bestLapMs)
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-white/50 sm:table-cell">
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
