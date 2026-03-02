import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { apiGet, updateManualActivity, ApiError } from "@/lib/api";
import ManualActivityForm, {
  type ManualActivityInitialData,
} from "@/components/ManualActivityForm";

type FormState = "idle" | "submitting" | "success" | "error";
type LoadState = "loading" | "ready" | "error";

type SessionDetailForEdit = {
  id: string;
  sim?: string | null;
  track?: string | null;
  trackId?: string | null;
  car?: string | null;
  carId?: string | null;
  position?: number | null;
  bestLapMs?: number | null;
  notes?: string | null;
  source?: string | null;
  userId?: string | null;
};

export default function EditManualActivity() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialData, setInitialData] =
    useState<ManualActivityInitialData | null>(null);

  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoadState("error");
      setLoadError("Missing session ID.");
      return;
    }

    setLoadState("loading");
    apiGet<SessionDetailForEdit>(`/api/sessions/${sessionId}`)
      .then((data) => {
        if (data.source !== "MANUAL_ACTIVITY") {
          setLoadState("error");
          setLoadError("This session cannot be edited.");
          return;
        }

        setInitialData({
          sim: data.sim,
          trackId: data.trackId ?? data.track,
          carId: data.carId ?? data.car,
          position: data.position,
          bestLapMs: data.bestLapMs,
          notes: data.notes,
        });
        setLoadState("ready");
      })
      .catch((err) => {
        setLoadState("error");
        setLoadError(
          err instanceof Error ? err.message : "Failed to load session."
        );
      });
  }, [sessionId]);

  async function handleSubmit(data: {
    sim: string;
    trackId: string;
    carId?: string;
    position?: number;
    bestLapMs?: number;
    notes?: string;
  }) {
    if (!sessionId) return;

    setFormState("submitting");
    setErrorMessage(null);

    try {
      await updateManualActivity(sessionId, data);
      setFormState("success");
      setTimeout(() => {
        navigate(`/sessions/${sessionId}`);
      }, 1000);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to update activity. Please try again.";
      setErrorMessage(message);
      setFormState("error");
    }
  }

  if (loadState === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
          <p className="text-sm text-white/60">Loading activity…</p>
        </div>
      </div>
    );
  }

  if (loadState === "error" || !initialData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-white/60">{loadError ?? "Failed to load."}</p>
            <Link
              to={sessionId ? `/sessions/${sessionId}` : "/"}
              className="mt-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">
              Edit Manual Activity
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Update your activity details.
            </p>
          </div>

          {formState === "success" ? (
            <div className="py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-white font-medium">Activity updated!</p>
              <p className="mt-1 text-sm text-white/50">
                Redirecting to session…
              </p>
            </div>
          ) : (
            <ManualActivityForm
              initialData={initialData}
              onSubmit={handleSubmit}
              submitLabel="Save Changes"
              submittingLabel="Saving…"
              isSubmitting={formState === "submitting"}
              errorMessage={errorMessage}
            />
          )}

          <div className="mt-6 text-center">
            <Link
              to={`/sessions/${sessionId}`}
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
