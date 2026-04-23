import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { apiGet, updateActivity, ApiError } from "@/lib/api";
import ManualActivityForm, {
  type ManualActivityInitialData,
} from "@/components/ManualActivityForm";
import { telemetrySessionTypeToFormKind } from "@/lib/sessionEditMapping";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateSessionDerivedCaches } from "@/lib/profileQueryKeys";

type FormState = "idle" | "submitting" | "success" | "error";

type SessionDetailForEdit = {
  id: string;
  sim?: string | null;
  simKey?: string | null;
  track?: string | null;
  trackId?: string | null;
  catalogTrackId?: string | null;
  car?: string | null;
  carId?: string | null;
  catalogCarId?: string | null;
  trackName?: string | null;
  carName?: string | null;
  vehicleDisplay?: string | null;
  position?: number | null;
  totalDrivers?: number | null;
  qualifyingPosition?: number | null;
  manualSessionKind?: string | null;
  bestLapMs?: number | null;
  sessionType?: string | null;
  notes?: string | null;
  laps?: Array<{ lap?: number; timeMs?: number; lapTimeMs?: number }>;
  lapCount?: number | null;
};

function simKeyToFormSim(k: string | undefined | null): string {
  const u = (k ?? "").toLowerCase();
  if (u === "f1_25") return "F1_25";
  return "IRACING";
}

export default function EditActivity() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const sid = sessionId?.trim() ?? "";

  const {
    data: initialData,
    isPending: loadLoading,
    error: loadErr,
    isError: loadFailed,
  } = useQuery({
    queryKey: ["sessions", "edit", sid],
    queryFn: async (): Promise<ManualActivityInitialData> => {
      const data = await apiGet<SessionDetailForEdit>(`/api/sessions/${sid}`);
      const st = String(data.sessionType ?? "").toUpperCase();

      const lapsRaw = Array.isArray(data.laps) ? data.laps : [];
      const lapsMs = [...lapsRaw]
        .filter((l) => l && typeof (l.timeMs ?? l.lapTimeMs) === "number")
        .sort((a, b) => (a.lap ?? 0) - (b.lap ?? 0))
        .map((l) => Number(l.timeMs ?? l.lapTimeMs));

      const lapCountFromApi =
        typeof data.lapCount === "number" && Number.isFinite(data.lapCount)
          ? data.lapCount
          : 0;
      const telemetryMinLapRows =
        Math.max(lapsMs.length, lapCountFromApi) > 0
          ? Math.max(lapsMs.length, lapCountFromApi)
          : undefined;

      let manualSessionKind: "PRACTICE" | "QUALIFY" | "RACE";
      if (st === "MANUAL_ACTIVITY") {
        const k = String(data.manualSessionKind ?? "RACE").toUpperCase();
        manualSessionKind =
          k === "PRACTICE" || k === "QUALIFY" || k === "RACE" ? k : "RACE";
      } else {
        manualSessionKind = telemetrySessionTypeToFormKind(data.sessionType);
      }

      return {
        sim: simKeyToFormSim(data.simKey),
        catalogTrackId: data.catalogTrackId ?? data.track ?? "",
        catalogCarId: data.catalogCarId ?? "",
        trackNameHint: data.trackName ?? null,
        carNameHint: data.carName ?? data.vehicleDisplay ?? null,
        manualSessionKind,
        position: data.position,
        totalDrivers: data.totalDrivers,
        qualifyingPosition: data.qualifyingPosition,
        lapsMs: lapsMs.length > 0 ? lapsMs : undefined,
        bestLapMs: lapsMs.length === 0 ? data.bestLapMs : undefined,
        notes: data.notes,
        telemetryMinLapRows,
      };
    },
    enabled: Boolean(sid),
  });

  const loadError = loadFailed
    ? loadErr instanceof Error
      ? loadErr.message
      : "Failed to load session."
    : null;

  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (!sessionId) return;

    setFormState("submitting");
    setErrorMessage(null);

    try {
      await updateActivity(sessionId, data);
      setFormState("success");
      invalidateSessionDerivedCaches(queryClient, {
        sessionId,
        ownerUserId: user?.id ?? null,
        removeSessionQueries: false,
      });
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

  if (!sid) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-white/60">Missing session ID.</p>
            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-white/40" />
          <p className="text-sm text-white/60">Loading activity…</p>
        </div>
      </div>
    );
  }

  if (loadFailed || !initialData) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-white/60">{loadError ?? "Failed to load."}</p>
            <Link
              to={sid ? `/sessions/${sid}` : "/"}
              className="mt-4 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-white">Edit activity</h1>
            <p className="mt-1 text-sm text-white/60">
              Update your session details.
            </p>
          </div>

          {formState === "success" ? (
            <div className="py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="size-6 text-green-500" />
                </div>
              </div>
              <p className="font-medium text-white">Activity updated!</p>
              <p className="mt-1 text-sm text-white/50">
                Redirecting to session…
              </p>
            </div>
          ) : (
            <ManualActivityForm
              key={`edit-${sid}-${initialData.telemetryMinLapRows ?? 0}`}
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
              className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
