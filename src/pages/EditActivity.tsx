import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { buildPageTitle } from "@/lib/seo";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { apiGet, updateActivity, ApiError } from "@/lib/api";
import ManualActivityForm from "@/components/ManualActivityForm";
import {
  manualActivityInitialFromPublicDetail,
  type PublicSessionDetailForEdit,
} from "@/lib/sessionEditInitialData";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateSessionDerivedCaches } from "@/lib/profileQueryKeys";

type FormState = "idle" | "submitting" | "success" | "error";

type SessionDetailForEdit = PublicSessionDetailForEdit & { id: string };

function EditPageShell({
  children,
  title,
  description,
  footer,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12 lg:max-w-xl">
        <div className="mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-card/20 p-5 shadow-sm backdrop-blur-lg sm:p-7">
          {children}
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
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

  const editPath = sid ? `/sessions/${sid}/edit` : "/sessions";
  const editMeta = (
    <PageMeta
      title={buildPageTitle("Edit session")}
      description={`Edit your ${COMPANY_NAME} session details.`}
      path={editPath}
      noindex
    />
  );

  const backFooter = sid ? (
    <p className="text-center text-sm text-white/45">
      <Link
        to={`/sessions/${sid}`}
        className="inline-flex items-center gap-1 font-medium text-white/70 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to session
      </Link>
    </p>
  ) : (
    <p className="text-center text-sm text-white/45">
      <Link
        to="/"
        className="inline-flex items-center gap-1 font-medium text-white/70 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Go home
      </Link>
    </p>
  );

  if (!sid) {
    return (
      <>
        {editMeta}
        <EditPageShell title="Edit session" footer={backFooter}>
          <p className="py-6 text-center text-sm text-white/60">
            Missing session ID.
          </p>
        </EditPageShell>
      </>
    );
  }

  if (loadLoading) {
    return (
      <>
        {editMeta}
        <EditPageShell
          title="Edit session"
          description="Loading your session details…"
          footer={backFooter}
        >
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="size-10 animate-spin text-white/40" />
            <p className="text-sm text-white/50">Loading activity…</p>
          </div>
        </EditPageShell>
      </>
    );
  }

  if (loadFailed || !initialData) {
    return (
      <>
        {editMeta}
        <EditPageShell title="Edit session" footer={backFooter}>
          <p className="py-6 text-center text-sm text-white/60">
            {loadError ?? "Failed to load session."}
          </p>
        </EditPageShell>
      </>
    );
  }

  return (
    <>
      {editMeta}
      <EditPageShell
        title="Edit session"
        description="Update sim, track, results, lap times, and notes for this session."
        footer={backFooter}
      >
        {formState === "success" ? (
          <div className="py-10 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                <CheckCircle className="size-7 text-green-500" />
              </div>
            </div>
            <p className="text-lg font-medium text-white">Session updated</p>
            <p className="mt-2 text-sm text-white/50">
              Redirecting to your session…
            </p>
          </div>
        ) : (
          <ManualActivityForm
            key={`edit-${sid}-${initialData.telemetryMinLapRows ?? 0}`}
            layout="page"
            initialData={initialData}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            isSubmitting={formState === "submitting"}
            errorMessage={errorMessage}
          />
        )}
      </EditPageShell>
    </>
  );
}
