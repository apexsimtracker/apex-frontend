import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Trophy, Upload as UploadIcon } from "lucide-react";
import { createManualActivity, getChallenge, ApiError } from "@/lib/api";
import type { ManualActivityRequest } from "@/lib/api";
import type { ManualActivityInitialData } from "@/components/ManualActivityForm";
import PageMeta from "@/components/PageMeta";
import ChallengeDetailBackLinkV2 from "@/pages/v2/challenges/ChallengeDetailBackLinkV2";
import {
  challengeDetailToManualPrefill,
  challengeManualPrefillToInitialData,
  type ChallengeManualPrefill,
} from "@/lib/challenges/challengeManualPrefill";
import { COMPANY_NAME } from "@/lib/siteMeta";
import ManualActivityFormV2 from "./manual/ManualActivityFormV2";
import ManualActivityFormSkeletonV2 from "./manual/ManualActivityFormSkeletonV2";

const MANUAL_PATH = "/v2/manual";
const manualTitle = `Log activity | ${COMPANY_NAME}`;
const manualDescription = `Log a sim racing session manually on ${COMPANY_NAME} when you don't have telemetry files.`;

type FormState = "idle" | "submitting" | "success" | "error";

type LogAgainState = {
  sim?: string;
  trackId?: string;
  carId?: string;
};

type ManualNavState = {
  logAgain?: LogAgainState;
  challengePrefill?: ChallengeManualPrefill;
} | null;

function logAgainToInitialData(
  logAgain: LogAgainState,
): ManualActivityInitialData {
  return {
    sim: logAgain.sim ?? null,
    trackId: logAgain.trackId ?? null,
    carId: logAgain.carId ?? null,
  };
}

export default function ManualActivityV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navState = location.state as ManualNavState;
  const logAgain = navState?.logAgain;
  const challengePrefill = navState?.challengePrefill;
  const challengeId = searchParams.get("challenge")?.trim() || undefined;
  const isChallengeLinked = Boolean(challengeId);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const needsChallengeFetch = Boolean(
    challengeId && !logAgain && !challengePrefill,
  );

  const { data: fetchedChallenge, isPending: challengePrefillLoading } =
    useQuery({
      queryKey: ["challenges", "detail", challengeId, "manual-prefill"],
      queryFn: async () => {
        const data = await getChallenge(challengeId!);
        if (!data) throw new Error("Challenge not found");
        return data;
      },
      enabled: needsChallengeFetch,
    });

  const initialData = useMemo((): ManualActivityInitialData | undefined => {
    if (logAgain && (logAgain.sim || logAgain.trackId)) {
      return logAgainToInitialData(logAgain);
    }
    if (challengePrefill?.sim && challengePrefill.track) {
      return challengeManualPrefillToInitialData(challengePrefill);
    }
    if (fetchedChallenge && !fetchedChallenge.banned) {
      return challengeManualPrefillToInitialData(
        challengeDetailToManualPrefill(fetchedChallenge),
      );
    }
    return undefined;
  }, [logAgain, challengePrefill, fetchedChallenge]);

  const prefilledFromPrevious = Boolean(
    logAgain && (logAgain.sim || logAgain.trackId),
  );
  const waitingForChallengePrefill =
    needsChallengeFetch && challengePrefillLoading;

  const pagePath = isChallengeLinked
    ? `${MANUAL_PATH}?challenge=${encodeURIComponent(challengeId!)}`
    : MANUAL_PATH;

  async function handleSubmit(data: ManualActivityRequest) {
    setFormState("submitting");
    setErrorMessage(null);

    try {
      const result = await createManualActivity({
        ...data,
        ...(challengeId ? { challengeId } : {}),
      });
      setFormState("success");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("apex:activity-updated"));
      }
      setTimeout(() => {
        navigate(`/v2/sessions/${result.sessionId}`);
      }, 1000);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to create activity. Please try again.";
      setErrorMessage(message);
      setFormState("error");
    }
  }

  return (
    <>
      <PageMeta
        title={manualTitle}
        description={manualDescription}
        path={pagePath}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-8 px-6 py-8">
        {isChallengeLinked && challengeId && (
          <ChallengeDetailBackLinkV2 challengeId={challengeId} />
        )}

        <div>
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Manual Entry
          </h1>
          <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            Record a session without telemetry. Saved to your sessions library
            and activity feed — not included in profile stats.
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl space-y-8">
          {isChallengeLinked && formState !== "success" && (
            <div className="flex items-start gap-3 rounded-v2-lg border border-v2-outline-variant/20 bg-v2-surface-container-high px-4 py-3">
              <Trophy
                className="mt-0.5 size-4 shrink-0 text-v2-primary"
                aria-hidden
              />
              <p className="font-v2-body text-sm text-v2-on-surface-variant">
                This session will count toward your active challenge when saved.
              </p>
            </div>
          )}

          {formState === "success" ? (
            <div className="rounded-v2-lg bg-v2-surface-container-low py-10 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-v2-success/10 ring-1 ring-v2-success/20">
                  <CheckCircle className="size-7 text-v2-success" />
                </div>
              </div>
              <p className="font-v2-body text-lg font-medium text-v2-on-surface">
                Activity logged
              </p>
              <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
                Redirecting to your session…
              </p>
            </div>
          ) : waitingForChallengePrefill ? (
            <ManualActivityFormSkeletonV2 />
          ) : (
            <ManualActivityFormV2
              initialData={initialData}
              prefilledFromPrevious={prefilledFromPrevious}
              hideRecentSessions={isChallengeLinked}
              onSubmit={handleSubmit}
              submitLabel="Save session"
              submittingLabel="Saving…"
              isSubmitting={formState === "submitting"}
              errorMessage={errorMessage}
            />
          )}

          {!isChallengeLinked && (
            <p className="text-center font-v2-body text-sm text-v2-on-surface-variant">
              Have an iRacing{" "}
              <code className="rounded-v2-sm bg-v2-surface-container-highest px-1.5 py-0.5 font-v2-body text-xs text-v2-on-surface">
                .ibt
              </code>{" "}
              file?{" "}
              <Link
                to="/v2/upload"
                className="inline-flex items-center gap-1 font-v2-body font-medium text-v2-on-surface transition-colors hover:text-v2-primary"
              >
                <UploadIcon className="size-3.5" aria-hidden />
                Upload telemetry
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
