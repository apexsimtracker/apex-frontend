import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { createManualActivity, ApiError } from "@/lib/api";
import ManualActivityForm from "@/components/ManualActivityForm";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";

const MANUAL_PATH = "/manual";
const manualTitle = `Log activity | ${COMPANY_NAME}`;
const manualDescription = `Log a sim racing session manually on ${COMPANY_NAME} when you don’t have telemetry files—${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

type FormState = "idle" | "submitting" | "success" | "error";

type LogAgainState = {
  sim?: string;
  trackId?: string;
  carId?: string;
};

export default function ManualActivity() {
  const navigate = useNavigate();
  const location = useLocation();
  const logAgain = (location.state as { logAgain?: LogAgainState } | null)
    ?.logAgain;
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
    carId?: string;
    position?: number;
    bestLapMs?: number;
    notes?: string;
  }) {
    setFormState("submitting");
    setErrorMessage(null);

    try {
      const result = await createManualActivity(data);
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
      <PageMeta title={manualTitle} description={manualDescription} path={MANUAL_PATH} />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">
              Log Manual Activity
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Record a session without telemetry data.
            </p>
          </div>

          {formState === "success" ? (
            <div className="py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-white font-medium">Activity logged!</p>
              <p className="mt-1 text-sm text-white/50">
                Redirecting to session…
              </p>
            </div>
          ) : (
            <ManualActivityForm
              initialData={initialData}
              prefilledFromPrevious={prefilledFromPrevious}
              onSubmit={handleSubmit}
              submitLabel="Log Activity"
              submittingLabel="Saving…"
              isSubmitting={formState === "submitting"}
              errorMessage={errorMessage}
            />
          )}

          <div className="mt-6 text-center">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
