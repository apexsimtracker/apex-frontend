import { useState, useMemo, type ReactNode } from "react";
import { useForm, useFormState, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Plus, Trash2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MANUAL_ACTIVITY_SIMS, type ManualActivitySim } from "@/lib/manualActivityData";
import { parseStrictManualLapTimeToMs, formatMsToLapTime } from "@/lib/utils";
import { useCatalogs } from "@/hooks/useCatalogs";
import {
  useRecentManualSessions,
  getRecentChipLabel,
  type RecentManualItem,
} from "@/hooks/useRecentManualSessions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import type { WithRootError } from "@/lib/formWithRootError";
import {
  createManualActivityFormSchema,
  effectiveManualLapMaxForForm,
  MANUAL_ACTIVITY_POSITION_MAX,
  MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX,
  type ManualActivityFormValues,
} from "@/lib/validation/manualActivity";
import { useManualActivityFormSync } from "@/features/manual-activity/hooks/useManualActivityFormSync";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 transition-colors focus:border-white/25 focus:bg-white/[0.07] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50";

const SESSION_KIND_OPTIONS = [
  { value: "PRACTICE" as const, label: "Practice" },
  { value: "QUALIFY" as const, label: "Qualifying" },
  { value: "RACE" as const, label: "Race" },
];

function FormBlock({
  layout,
  title,
  description,
  children,
  className,
}: {
  layout: "default" | "page";
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  if (layout !== "page" || !title) {
    return <>{children}</>;
  }
  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5",
        className
      )}
    >
      <header className="mb-4 border-b border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-white/50">{description}</p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export type ManualActivityFormData = {
  sim: ManualActivitySim | "";
  trackId: string;
  carId: string;
  manualSessionKind: "PRACTICE" | "QUALIFY" | "RACE" | "";
  position: string;
  totalDrivers: string;
  qualifyingPosition: string;
  laps: { lapTime: string }[];
  notes: string;
};

export type ManualActivityInitialData = {
  sim?: string | null;
  trackId?: string | null;
  carId?: string | null;
  /** Raw stored track token from session (prefer over `trackId` when editing telemetry). */
  catalogTrackId?: string | null;
  /** Raw stored car token from session (never use session detail `car`, which may be display-only). */
  catalogCarId?: string | null;
  /** Resolve catalog track when stored token is not a catalog id (e.g. legacy ingest strings). */
  trackNameHint?: string | null;
  /** Resolve catalog car when stored token does not match (e.g. normalize display name to id). */
  carNameHint?: string | null;
  manualSessionKind?: "PRACTICE" | "QUALIFY" | "RACE" | string | null;
  position?: number | null;
  totalDrivers?: number | null;
  qualifyingPosition?: number | null;
  /** @deprecated prefer lapsMs */
  bestLapMs?: number | null;
  /** Ordered lap times in ms (e.g. from session detail). */
  lapsMs?: number[] | null;
  notes?: string | null;
  /** Edit: floor for max lap rows when session has more laps than the manual-create cap. */
  telemetryMinLapRows?: number | null;
};

interface ManualActivityFormProps {
  /** Rich sectioned layout for the standalone /manual page. */
  layout?: "default" | "page";
  initialData?: ManualActivityInitialData;
  prefilledFromPrevious?: boolean;
  onSubmit: (data: {
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
  }) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
}

function formatMsToInput(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  return formatMsToLapTime(ms);
}

function normLabel(s: string): string {
  return s.trim().toLowerCase();
}

function resolveCatalogTrackId(
  catalog: { id: string; name: string }[],
  storedToken: string,
  nameHint: string | null | undefined
): string {
  const token = storedToken?.trim();
  if (token && catalog.some((t) => t.id === token)) return token;
  if (token) {
    const byTokenAsName = catalog.find((t) => normLabel(t.name) === normLabel(token));
    if (byTokenAsName) return byTokenAsName.id;
  }
  const h = nameHint?.trim();
  if (!h) return "";
  const nh = normLabel(h);
  const exact = catalog.find((t) => normLabel(t.name) === nh);
  if (exact) return exact.id;
  const partial = catalog.find(
    (t) => nh.includes(normLabel(t.name)) || normLabel(t.name).includes(nh)
  );
  return partial?.id ?? "";
}

function resolveCatalogCarId(
  catalog: { id: string; name: string }[],
  storedToken: string,
  nameHint: string | null | undefined
): string {
  const token = storedToken?.trim();
  if (token && catalog.some((c) => c.id === token)) return token;
  if (token) {
    const byTokenAsName = catalog.find((c) => normLabel(c.name) === normLabel(token));
    if (byTokenAsName) return byTokenAsName.id;
  }
  const h = nameHint?.trim();
  if (!h) return "";
  const nh = normLabel(h);
  const exact = catalog.find((c) => normLabel(c.name) === nh);
  if (exact) return exact.id;
  const partial = catalog.find(
    (c) => nh.includes(normLabel(c.name)) || normLabel(c.name).includes(nh)
  );
  return partial?.id ?? "";
}

function buildDefaults(initial?: ManualActivityInitialData): ManualActivityFormValues {
  let laps: { lapTime: string }[];
  if (initial?.lapsMs && initial.lapsMs.length > 0) {
    laps = initial.lapsMs.map((ms) => ({ lapTime: formatMsToInput(ms) }));
  } else if (initial?.bestLapMs != null && Number.isFinite(initial.bestLapMs)) {
    laps = [{ lapTime: formatMsToInput(initial.bestLapMs) }];
  } else {
    laps = [{ lapTime: "" }];
  }
  const kindRaw = initial?.manualSessionKind?.trim().toUpperCase();
  const manualSessionKind =
    kindRaw === "PRACTICE" || kindRaw === "QUALIFY" || kindRaw === "RACE"
      ? kindRaw
      : "RACE";

  return {
    sim: (initial?.sim as string) || "",
    trackId: initial?.catalogTrackId ?? initial?.trackId ?? "",
    carId: initial?.catalogCarId ?? initial?.carId ?? "",
    manualSessionKind,
    position: initial?.position != null ? String(initial.position) : "",
    totalDrivers: initial?.totalDrivers != null ? String(initial.totalDrivers) : "",
    qualifyingPosition:
      initial?.qualifyingPosition != null ? String(initial.qualifyingPosition) : "",
    laps,
    notes: initial?.notes ?? "",
  };
}

export default function ManualActivityForm({
  layout = "default",
  initialData,
  prefilledFromPrevious = false,
  onSubmit,
  submitLabel,
  submittingLabel,
  isSubmitting,
  errorMessage,
}: ManualActivityFormProps) {
  const telemetryMinLapRows = initialData?.telemetryMinLapRows ?? null;
  const activitySchema = useMemo(
    () => createManualActivityFormSchema(telemetryMinLapRows),
    [telemetryMinLapRows]
  );

  const [pendingRecent, setPendingRecent] = useState<{
    trackToken: string;
    trackName: string;
    carToken: string;
    carName: string;
  } | null>(null);

  const form = useForm<WithRootError<ManualActivityFormValues>>({
    resolver: zodResolver(activitySchema),
    defaultValues: buildDefaults(initialData),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "laps",
  });

  const { errors: formErrors } = useFormState({ control: form.control });

  const sim = form.watch("sim") as ManualActivitySim | "";
  const sessionKind = form.watch("manualSessionKind");
  const lapsWatch = form.watch("laps");

  const maxLapsForSim = effectiveManualLapMaxForForm(sim || "", telemetryMinLapRows ?? null);
  const canAddLap = fields.length < maxLapsForSim;
  const canRemoveLap = fields.length > 1;

  const { tracks, cars, loading: catalogsLoading, error: catalogsError, retry: retryCatalogs } =
    useCatalogs(sim || null);
  const { recent: recentItems, loading: recentLoading } = useRecentManualSessions();

  useManualActivityFormSync({
    initialData,
    errorMessage,
    form,
    sim,
    telemetryMinLapRows,
    tracks,
    cars,
    pendingRecent,
    setPendingRecent,
    buildDefaults,
    resolveCatalogTrackId,
    resolveCatalogCarId,
  });

  function handleRecentChipClick(item: RecentManualItem) {
    form.setValue("sim", item.sim);
    form.setValue("trackId", item.trackId);
    form.setValue("carId", item.carId ?? "");
    setPendingRecent({
      trackToken: item.trackId,
      trackName: item.trackName,
      carToken: item.carId ?? "",
      carName: item.carName ?? "—",
    });
  }

  async function handleValid(values: ManualActivityFormValues) {
    form.clearErrors("root");
    const positionNum = values.position.trim() ? parseInt(values.position, 10) : undefined;
    const totalDriversNum = values.totalDrivers.trim()
      ? parseInt(values.totalDrivers, 10)
      : undefined;

    const lapTimesMs = values.laps
      .map((r) => r.lapTime.trim())
      .filter(Boolean)
      .map((t) => parseStrictManualLapTimeToMs(t))
      .filter((ms): ms is number => ms != null);

    if (lapTimesMs.length === 0) {
      form.setError("laps", {
        type: "manual",
        message: "At least one valid lap time is required",
      });
      return;
    }

    const lapsOut = lapTimesMs.map((lapTimeMs) => ({ lapTimeMs }));
    const bestLapMs = Math.min(...lapTimesMs);

    const kind = values.manualSessionKind.trim().toUpperCase() as
      | "PRACTICE"
      | "QUALIFY"
      | "RACE";
    const qualiNum = values.qualifyingPosition.trim()
      ? parseInt(values.qualifyingPosition, 10)
      : undefined;

    await onSubmit({
      sim: values.sim,
      trackId: values.trackId,
      manualSessionKind: kind,
      carId: values.carId || undefined,
      position: kind === "PRACTICE" ? undefined : positionNum,
      totalDrivers: kind === "PRACTICE" ? undefined : totalDriversNum,
      qualifyingPosition:
        kind === "RACE" && qualiNum !== undefined && Number.isFinite(qualiNum)
          ? qualiNum
          : undefined,
      ...(lapsOut.length > 0 ? { laps: lapsOut, bestLapMs } : {}),
      notes: values.notes.trim() || undefined,
    });
  }

  const showRecent =
    !recentLoading && recentItems.length > 0 && !catalogsLoading;
  const showQuickFill = showRecent || prefilledFromPrevious;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleValid)}
        className={layout === "page" ? "space-y-5" : "space-y-4"}
      >
        {showQuickFill && (
          <FormBlock
            layout={layout}
            title="Quick fill"
            description="Reuse sim, track, and car from a recent session."
          >
            {prefilledFromPrevious && (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
                Pre-filled from your last log on this page.
              </p>
            )}
            {showRecent && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
                  <History className="size-3.5 shrink-0" aria-hidden />
                  Recent sessions
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleRecentChipClick(item)}
                      disabled={isSubmitting}
                      title={getRecentChipLabel(item)}
                      className={cn(
                        "max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50",
                        layout === "page" && "sm:max-w-[14rem]"
                      )}
                    >
                      {getRecentChipLabel(item)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </FormBlock>
        )}

        <FormBlock
          layout={layout}
          title="Session details"
          description="Choose your sim, track, and session type."
        >
        <FormField
          control={form.control}
          name="sim"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="sim" className="text-white/80">
                Sim / Game <span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <select
                  id="sim"
                  value={field.value}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v);
                    form.setValue("trackId", "");
                    form.setValue("carId", "");
                    setPendingRecent(null);
                  }}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                >
                  <option value="">Select sim…</option>
                  {MANUAL_ACTIVITY_SIMS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        {catalogsError && sim && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-500/10 p-3">
            <p className="text-sm text-red-500">{catalogsError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retryCatalogs}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Retry
            </Button>
          </div>
        )}

        <FormField
          control={form.control}
          name="trackId"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="track" className="text-white/80">
                Track <span className="text-red-400">*</span>
                {catalogsLoading && sim && (
                  <span className="ml-2 text-xs font-normal text-white/50">
                    <Loader2 className="mr-0.5 inline size-3 animate-spin align-middle" />
                    Loading…
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <select
                  id="track"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting || !sim || catalogsLoading}
                  className={INPUT_CLASS}
                >
                  <option value="">
                    {!sim
                      ? "Select a sim first"
                      : catalogsLoading
                        ? "Loading…"
                        : "Select track…"}
                  </option>
                  {field.value.trim() &&
                  !tracks.some((t) => t.id === field.value) && (
                    <option value={field.value}>
                      {field.value} (stored token — not in catalog)
                    </option>
                  )}
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="carId"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="car" className="text-white/80">
                Car <span className="text-white/40">(optional)</span>
                {catalogsLoading && sim && (
                  <span className="ml-2 text-xs font-normal text-white/50">
                    <Loader2 className="mr-0.5 inline size-3 animate-spin align-middle" />
                    Loading…
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <select
                  id="car"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting || !sim || catalogsLoading}
                  className={INPUT_CLASS}
                >
                  <option value="">
                    {!sim
                      ? "Select a sim first"
                      : catalogsLoading
                        ? "Loading…"
                        : "Select car…"}
                  </option>
                  {field.value.trim() &&
                  !cars.some((c) => c.id === field.value) && (
                    <option value={field.value}>
                      {field.value} (stored token — not in catalog)
                    </option>
                  )}
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manualSessionKind"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                htmlFor={layout === "page" ? undefined : "manualSessionKind"}
                className="text-white/80"
              >
                Session type <span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                {layout === "page" ? (
                  <div
                    className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
                    role="group"
                    aria-label="Session type"
                  >
                    {SESSION_KIND_OPTIONS.map((option) => {
                      const active = (field.value || "RACE") === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "rounded-md px-2 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                            active
                              ? "bg-white text-black shadow-sm"
                              : "text-white/60 hover:text-white"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    id="manualSessionKind"
                    value={field.value || "RACE"}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    className={INPUT_CLASS}
                  >
                    <option value="PRACTICE">Practice</option>
                    <option value="QUALIFY">Qualifying</option>
                    <option value="RACE">Race</option>
                  </select>
                )}
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />
        </FormBlock>

        <FormBlock
          layout={layout}
          title="Results"
          description={
            sessionKind === "PRACTICE"
              ? "Finishing position is not used for practice sessions."
              : "Optional — helps track wins, podiums, and grid position."
          }
        >
        <div className={sessionKind === "PRACTICE" ? "opacity-60" : ""}>
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            {sessionKind === "QUALIFY"
              ? "Qualifying position"
              : sessionKind === "RACE"
                ? "Race finish"
                : "Finishing position"}{" "}
            <span className="text-white/40">
              ({sessionKind === "PRACTICE" ? "not used" : "optional"})
            </span>
          </label>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] sm:items-start sm:gap-2">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <input
                      id="position"
                      type="number"
                      min={1}
                      max={MANUAL_ACTIVITY_POSITION_MAX}
                      inputMode="numeric"
                      disabled={isSubmitting || sessionKind === "PRACTICE"}
                      placeholder="7"
                      className={INPUT_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
            <span className="text-xs text-white/60 sm:mt-3 sm:text-center">out of</span>
            <div className="flex gap-1">
              <FormField
                control={form.control}
                name="totalDrivers"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <input
                        id="totalDrivers"
                        type="number"
                        min={1}
                        max={MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX}
                        inputMode="numeric"
                        disabled={isSubmitting || sessionKind === "PRACTICE"}
                        placeholder="20"
                        className={INPUT_CLASS}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <span className="shrink-0 text-xs text-white/60 sm:mt-3">drivers</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-white/40">
            {sessionKind === "PRACTICE"
              ? "Practice sessions do not use finishing position."
              : sessionKind === "QUALIFY"
                ? "Your position after qualifying. Leave empty if unknown."
                : "Your race result. Leave empty if unknown."}
          </p>
        </div>

        {sessionKind === "RACE" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              Qualifying position <span className="text-white/40">(optional)</span>
            </label>
            <FormField
              control={form.control}
              name="qualifyingPosition"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input
                      type="number"
                      min={1}
                      max={MANUAL_ACTIVITY_POSITION_MAX}
                      inputMode="numeric"
                      disabled={isSubmitting}
                      placeholder="e.g. 3"
                      className={cn(INPUT_CLASS, "max-w-xs")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
            <p className="mt-1 text-xs text-white/40">
              Where you started on the grid (from qualifying).
            </p>
          </div>
        )}
        </FormBlock>

        <FormBlock
          layout={layout}
          title="Lap times"
          description="Add at least one valid lap time for this session."
        >
        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            {layout === "default" ? (
              <FormLabel className="text-white/80">
                Laps{" "}
                <span className="text-white/40">(required)</span>
              </FormLabel>
            ) : (
              <span className="text-xs font-medium text-white/50">Lap entries (required)</span>
            )}
            <span className="text-xs text-white/40">
              {sim ? `Max ${maxLapsForSim} · ${fields.length} row${fields.length === 1 ? "" : "s"}` : "Select sim for limit"}
            </span>
          </div>
          <div
            className={cn(
              layout === "page" && fields.length > 0 && "divide-y divide-white/5 rounded-lg border border-white/10"
            )}
          >
          {fields.map((fieldItem, index) => {
            const raw = lapsWatch?.[index]?.lapTime ?? "";
            const parsed = raw.trim() ? parseStrictManualLapTimeToMs(raw) : null;
            const lapInvalid = raw.trim() !== "" && parsed === null;
            return (
              <FormField
                key={fieldItem.id}
                control={form.control}
                name={`laps.${index}.lapTime`}
                render={({ field }) => (
                  <FormItem className={layout === "page" ? "p-3 sm:p-4" : undefined}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <FormLabel className="text-xs text-white/50">
                          Lap {index + 1}
                        </FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            disabled={isSubmitting}
                            placeholder="1:32.456 · 92.456 · 0:59.900"
                            className={cn(
                              "mt-1 w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 transition-colors focus:outline-none focus:ring-0 disabled:opacity-50",
                              lapInvalid
                                ? "border-red-500/50 focus:border-red-500/50"
                                : "border-white/10 focus:border-white/25 focus:bg-white/[0.07]"
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                        {raw.trim() && parsed != null && !formErrors.laps?.[index]?.lapTime && (
                          <p className="mt-1 text-xs text-white/50">
                            Saved as {formatMsToLapTime(parsed)}
                          </p>
                        )}
                      </div>
                      {canRemoveLap && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className={cn(
                            "shrink-0 border-white/20 text-white/80 hover:bg-white/10",
                            layout === "page" ? "mt-5" : "mt-6"
                          )}
                          disabled={isSubmitting}
                          onClick={() => remove(index)}
                          aria-label={`Remove lap ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            );
          })}
          </div>
          {formErrors.laps && typeof formErrors.laps.message === "string" && (
            <p className="text-xs text-red-500">{formErrors.laps.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/20 text-white/80 hover:bg-white/10"
            disabled={isSubmitting || !canAddLap}
            onClick={() => append({ lapTime: "" })}
          >
            <Plus className="mr-1 size-4" />
            Add lap
          </Button>
        </div>
        </FormBlock>

        <FormBlock layout={layout} title="Notes" description="Anything else to remember about this session.">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="notes" className={layout === "page" ? "sr-only" : "text-white/80"}>
                Notes <span className="text-white/40">(optional)</span>
              </FormLabel>
              <FormControl>
                <textarea
                  id="notes"
                  disabled={isSubmitting}
                  placeholder="Setup changes, weather, incidents, strategy…"
                  rows={layout === "page" ? 4 : 3}
                  className={cn(INPUT_CLASS, "resize-none")}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />
        </FormBlock>

        {formErrors.root?.message ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
            <FormRootMessage className="flex-1" />
          </div>
        ) : null}

        <div
          className={cn(
            layout === "page" && "border-t border-white/10 pt-5"
          )}
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            size={layout === "page" ? "lg" : "default"}
            className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
