import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  PenLine,
  Trophy,
  Upload as UploadIcon,
} from "lucide-react";
import { createManualActivity, ApiError } from "@/lib/api";
import ManualActivityForm from "@/components/ManualActivityForm";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";

const MANUAL_PATH = "/manual";
const manualTitle = `Log activity | ${COMPANY_NAME}`;
const manualDescription = `Log a sim racing session manually on ${COMPANY_NAME} when you don't have telemetry files.`;

type FormState = "idle" | "submitting" | "success" | "error";

type LogAgainState = {
  sim?: string;
  trackId?: string;
  carId?: string;
};

export default function ManualActivity() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { logAgain?: LogAgainState; challengeId?: string } | null;
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
      <PageMeta title={manualTitle} description={manualDescription} path={MANUAL_PATH} noindex />
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12 lg:max-w-xl">
          <div className="mb-8">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
                Log manual activity
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                Record a session without telemetry. Add lap times to appear on fastest-lap
                leaderboards.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card/20 p-5 shadow-sm backdrop-blur-lg sm:p-7">
            {challengeId && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <Trophy className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                <p className="text-sm text-amber-100/90">
                  This session will count toward your active challenge when saved.
                </p>
              </div>
            )}

            {formState === "success" ? (
              <div className="py-10 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                    <CheckCircle className="size-7 text-green-500" />
                  </div>
                </div>
                <p className="text-lg font-medium text-white">Activity logged</p>
                <p className="mt-2 text-sm text-white/50">Redirecting to your session…</p>
              </div>
            ) : (
              <ManualActivityForm
                layout="page"
                initialData={initialData}
                prefilledFromPrevious={prefilledFromPrevious}
                onSubmit={handleSubmit}
                submitLabel="Log activity"
                submittingLabel="Saving…"
                isSubmitting={formState === "submitting"}
                errorMessage={errorMessage}
              />
            )}
          </div>

          <p className="mt-6 text-center text-sm text-white/45">
            Have an iRacing{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/70">.ibt</code>{" "}
            file?{" "}
            <Link
              to="/upload"
              className="inline-flex items-center gap-1 font-medium text-white/70 transition-colors hover:text-white"
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
