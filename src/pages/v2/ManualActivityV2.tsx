import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Trophy, Upload as UploadIcon } from "lucide-react";
import { createManualActivity, ApiError } from "@/lib/api";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import ManualActivityFormV2 from "./manual/ManualActivityFormV2";

const MANUAL_PATH = "/v2/manual";
const manualTitle = `Log activity | ${COMPANY_NAME}`;
const manualDescription = `Log a sim racing session manually on ${COMPANY_NAME} when you don't have telemetry files.`;

type FormState = "idle" | "submitting" | "success" | "error";

type LogAgainState = {
  sim?: string;
  trackId?: string;
  carId?: string;
};

export default function ManualActivityV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as {
    logAgain?: LogAgainState;
    challengeId?: string;
  } | null;
  const logAgain = navState?.logAgain;
  const challengeId =
    typeof navState?.challengeId === "string" && navState.challengeId.trim()
      ? navState.challengeId.trim()
      : undefined;
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialData =
    logAgain && (logAgain.sim || logAgain.trackId)
      ? {
          sim: logAgain.sim ?? null,
          trackId: logAgain.trackId ?? null,
          carId: logAgain.carId ?? null,
        }
      : undefined;
  const prefilledFromPrevious = Boolean(initialData);

  async function handleSubmit(data: {
    sim: string;
    trackId: string;
    manualSessionKind: "PRACTICE" | "QUALIFY" | "RACE";
    carId?: string;
    position?: number;
    totalDrivers?: number;
    qualifyingPosition?: number;
    laps?: { lapTimeMs: number }[];
    bestLapMs?: number;
    notes?: string;
  }) {
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
        navigate(`/sessions/${result.sessionId}`);
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
        path={MANUAL_PATH}
        noindex
      />
      <div className="flex-1 overflow-y-auto bg-v2-background">
        <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12 lg:max-w-xl">
          <div className="mb-8">
            <div className="min-w-0">
              <h1 className="font-v2-headline text-2xl font-semibold tracking-tight text-v2-on-surface sm:text-[1.65rem]">
                Log manual activity
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-v2-on-surface-variant">
                Record a session without telemetry. Add lap times to appear on
                fastest-lap leaderboards.
              </p>
            </div>
          </div>

          <div className="v2-kinetic-glass rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-5 shadow-sm sm:p-7">
            {challengeId && formState !== "success" && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <Trophy
                  className="mt-0.5 size-4 shrink-0 text-amber-400"
                  aria-hidden
                />
                <p className="text-sm text-amber-100/90">
                  This session will count toward your active challenge when
                  saved.
                </p>
              </div>
            )}

            {formState === "success" ? (
              <div className="py-10 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-v2-success/10 ring-1 ring-v2-success/20">
                    <CheckCircle className="size-7 text-v2-success" />
                  </div>
                </div>
                <p className="text-lg font-medium text-v2-on-surface">
                  Activity logged
                </p>
                <p className="mt-2 text-sm text-v2-on-surface-variant">
                  Redirecting to your session…
                </p>
              </div>
            ) : (
              <ManualActivityFormV2
                initialData={initialData}
                prefilledFromPrevious={prefilledFromPrevious}
                onSubmit={handleSubmit}
                submitLabel="Save session"
                submittingLabel="Saving…"
                isSubmitting={formState === "submitting"}
                errorMessage={errorMessage}
              />
            )}
          </div>

          <p className="mt-6 text-center text-sm text-v2-on-surface-variant">
            Have an iRacing{" "}
            <code className="rounded bg-v2-surface-container-highest px-1.5 py-0.5 text-xs text-v2-on-surface">
              .ibt
            </code>{" "}
            file?{" "}
            <Link
              to="/v2/upload"
              className="inline-flex items-center gap-1 font-medium text-v2-on-surface transition-colors hover:text-v2-primary"
            >
              <UploadIcon className="size-3.5" aria-hidden />
              Upload telemetry
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
