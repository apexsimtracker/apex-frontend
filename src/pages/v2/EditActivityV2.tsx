import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { buildPageTitle } from "@/lib/seo";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { apiGet, updateActivity, ApiError } from "@/lib/api";
import {
  manualActivityInitialFromPublicDetail,
  type PublicSessionDetailForEdit,
} from "@/lib/sessionEditInitialData";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateSessionDerivedCaches } from "@/lib/profileQueryKeys";
import ManualActivityFormV2 from "./manual/ManualActivityFormV2";

type FormState = "idle" | "submitting" | "success" | "error";

type SessionDetailForEdit = PublicSessionDetailForEdit & { id: string };

export default function EditActivityV2() {
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
    queryFn: async () => {
      const data = await apiGet<SessionDetailForEdit>(`/api/sessions/${sid}`);
      return manualActivityInitialFromPublicDetail(data);
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
        navigate(`/v2/sessions/${sessionId}`);
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

  const editPath = sid ? `/v2/sessions/${sid}/edit` : "/v2/sessions";
  const editMeta = (
    <PageMeta
      title={buildPageTitle("Edit session")}
      description={`Edit your ${COMPANY_NAME} session details.`}
      path={editPath}
      noindex
    />
  );

  const backFooter = sid ? (
    <p className="mt-6 text-center text-sm text-v2-on-surface-variant">
      <Link
        to={`/v2/sessions/${sid}`}
        className="inline-flex items-center gap-1 font-medium text-v2-on-surface transition-colors hover:text-v2-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to session
      </Link>
    </p>
  ) : (
    <p className="mt-6 text-center text-sm text-v2-on-surface-variant">
      <Link
        to="/v2"
        className="inline-flex items-center gap-1 font-medium text-v2-on-surface transition-colors hover:text-v2-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Go home
      </Link>
    </p>
  );

  function renderCard(children: React.ReactNode) {
    return (
      <div className="v2-kinetic-glass rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-5 shadow-sm sm:p-7">
        {children}
      </div>
    );
  }

  let body: React.ReactNode;
  if (!sid) {
    body = renderCard(
      <p className="py-6 text-center text-sm text-v2-on-surface-variant">
        Missing session ID.
      </p>,
    );
  } else if (loadLoading) {
    body = renderCard(
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="size-10 animate-spin text-v2-on-surface-variant/40" />
        <p className="text-sm text-v2-on-surface-variant">Loading activity…</p>
      </div>,
    );
  } else if (loadFailed || !initialData) {
    body = renderCard(
      <p className="py-6 text-center text-sm text-v2-on-surface-variant">
        {loadError ?? "Failed to load session."}
      </p>,
    );
  } else {
    body = renderCard(
      formState === "success" ? (
        <div className="py-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-v2-success/10 ring-1 ring-v2-success/20">
              <CheckCircle className="size-7 text-v2-success" />
            </div>
          </div>
          <p className="text-lg font-medium text-v2-on-surface">
            Session updated
          </p>
          <p className="mt-2 text-sm text-v2-on-surface-variant">
            Redirecting to your session…
          </p>
        </div>
      ) : (
        <ManualActivityFormV2
          key={`edit-${sid}-${initialData.telemetryMinLapRows ?? 0}`}
          initialData={initialData}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          isSubmitting={formState === "submitting"}
          errorMessage={errorMessage}
        />
      ),
    );
  }

  return (
    <>
      {editMeta}
      <div className="flex-1 overflow-y-auto bg-v2-background">
        <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12 lg:max-w-xl">
          <div className="mb-8">
            <div className="min-w-0">
              <h1 className="font-v2-headline text-2xl font-semibold tracking-tight text-v2-on-surface sm:text-[1.65rem]">
                Edit session
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-v2-on-surface-variant">
                Update sim, track, results, lap times, and notes for this
                session.
              </p>
            </div>
          </div>

          {body}

          {backFooter}
        </div>
      </div>
    </>
  );
}
