import { useState, useMemo, useRef, useEffect } from "react";
import {
  useForm,
  useFormState,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import type { ControllerRenderProps, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Lock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MANUAL_ACTIVITY_SIMS,
  type ManualActivitySim,
} from "@/lib/manualActivityData";
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
  effectiveManualLapMaxForForm,
  MANUAL_ACTIVITY_POSITION_MAX,
  MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX,
} from "@/lib/validation/manualActivity";
import type { ManualActivityRequest } from "@/lib/api/manualAndUpload";
import type { ManualActivityEditInitialData } from "@/lib/sessionEditInitialData";
import { useManualActivityFormSync } from "@/features/manual-activity/hooks/useManualActivityFormSync";
import {
  createManualActivityV2FormSchema,
  isValidSectorTimeFormat,
  parseSectorTimeToMs,
  MANUAL_V2_CONDITIONS,
  type ManualActivityV2FormValues,
} from "./manualActivityV2Schema";
import V2NativeSelect from "@/components/v2/ui/V2NativeSelect";
import {
  v2ManualInputClassName,
  v2ManualTextareaClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";

// Loveable "Manual Entry" (loveable-ui/public/screens/manual-entry.html) styling
// mapped to v2- tokens: apex-red = --v2-primary, brand-card ≈ surface-container,
// Space Grotesk = font-v2-headline. Labels are tiny uppercase Space Grotesk.
const LABEL_CLASS =
  "mb-2 block font-v2-headline text-[11px] font-bold uppercase tracking-wider text-v2-on-surface-variant";

const SECTION_LABEL_CLASS =
  "font-v2-headline text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant";

const INPUT_CLASS = v2ManualInputClassName;

// Loveable pill: bordered, uppercase, red-tinted (not solid) when active.
function pillClass(active: boolean): string {
  return cn(
    "rounded-[0.5rem] border py-3 font-v2-headline text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50",
    active
      ? "border-v2-primary bg-v2-primary/10 text-v2-on-surface"
      : "border-v2-outline-variant/40 bg-v2-surface-container text-v2-on-surface-variant hover:border-v2-outline-variant hover:text-v2-on-surface",
  );
}

const SESSION_KIND_OPTIONS = [
  { value: "PRACTICE" as const, label: "Practice" },
  { value: "QUALIFY" as const, label: "Qualifying" },
  { value: "RACE" as const, label: "Race" },
];

// Borderless monospace input — Loveable lap table: only the time text is visible.
const CELL_INPUT_CLASS =
  "manual-lap-cell !m-0 !h-auto !min-h-0 !w-full !min-w-0 !appearance-none !border-0 !bg-transparent !p-0 text-center font-mono text-xs !shadow-none !outline-none !ring-0 [color-scheme:dark] placeholder:text-v2-outline-variant/60 focus:!border-0 focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 disabled:opacity-50";

const CELL_SECTOR_CLASS = "manual-lap-cell-sector text-v2-on-surface-variant";
const CELL_TOTAL_CLASS = "manual-lap-cell-total text-v2-primary";

type LapFieldPath = FieldPath<WithRootError<ManualActivityV2FormValues>>;

function LapTableCellField({
  field,
  displayClassName,
  placeholder,
  ariaLabel,
  disabled,
  align = "center",
  invalid = false,
}: {
  field: ControllerRenderProps<
    WithRootError<ManualActivityV2FormValues>,
    LapFieldPath
  >;
  displayClassName: string;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  align?: "center" | "right";
  invalid?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const value = String(field.value ?? "");
  const hasValue = value.trim().length > 0;
  const showInput = editing || !hasValue;

  if (!showInput) {
    return (
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "w-full border-0 bg-transparent p-0 font-mono text-xs disabled:cursor-not-allowed disabled:text-v2-on-surface-variant/40",
          align === "right" ? "text-right font-bold" : "text-center",
          invalid ? "manual-lap-cell-invalid text-v2-error" : displayClassName,
        )}
        onClick={() => {
          setEditing(true);
          requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          });
        }}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      {...field}
      ref={(el) => {
        field.ref(el);
        inputRef.current = el;
      }}
      value={value}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn(
        CELL_INPUT_CLASS,
        disabled &&
          "cursor-not-allowed text-v2-on-surface-variant/40 placeholder:text-v2-on-surface-variant/30",
        align === "right" && "text-right font-bold",
        invalid ? "manual-lap-cell-invalid text-v2-error" : displayClassName,
      )}
      onFocus={() => setEditing(true)}
      onBlur={() => {
        field.onBlur();
        setEditing(false);
      }}
    />
  );
}

function FormBlock({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-4 sm:p-5",
        className,
      )}
    >
      <header className="mb-4 border-b border-v2-outline-variant/10 pb-3">
        <h3 className={SECTION_LABEL_CLASS}>{title}</h3>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-v2-on-surface-variant">
            {description}
          </p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// Duplicated verbatim from V1 ManualActivityForm (pure catalog-token resolvers).
// Forked intentionally for the V2 page; keep in sync if V1 logic changes.
function normLabel(s: string): string {
  return s.trim().toLowerCase();
}

function resolveCatalogTrackId(
  catalog: { id: string; name: string }[],
  storedToken: string,
  nameHint: string | null | undefined,
): string {
  const token = storedToken?.trim();
  if (token && catalog.some((t) => t.id === token)) return token;
  if (token) {
    const byTokenAsName = catalog.find(
      (t) => normLabel(t.name) === normLabel(token),
    );
    if (byTokenAsName) return byTokenAsName.id;
  }
  const h = nameHint?.trim();
  if (!h) return "";
  const nh = normLabel(h);
  const exact = catalog.find((t) => normLabel(t.name) === nh);
  if (exact) return exact.id;
  const partial = catalog.find(
    (t) => nh.includes(normLabel(t.name)) || normLabel(t.name).includes(nh),
  );
  return partial?.id ?? "";
}

function resolveCatalogCarId(
  catalog: { id: string; name: string }[],
  storedToken: string,
  nameHint: string | null | undefined,
): string {
  const token = storedToken?.trim();
  if (token && catalog.some((c) => c.id === token)) return token;
  if (token) {
    const byTokenAsName = catalog.find(
      (c) => normLabel(c.name) === normLabel(token),
    );
    if (byTokenAsName) return byTokenAsName.id;
  }
  const h = nameHint?.trim();
  if (!h) return "";
  const nh = normLabel(h);
  const exact = catalog.find((c) => normLabel(c.name) === nh);
  if (exact) return exact.id;
  const partial = catalog.find(
    (c) => nh.includes(normLabel(c.name)) || normLabel(c.name).includes(nh),
  );
  return partial?.id ?? "";
}

function formatMsToInput(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  return formatMsToLapTime(ms);
}

function buildDefaults(
  initial?: ManualActivityEditInitialData,
): ManualActivityV2FormValues {
  let laps: ManualActivityV2FormValues["laps"];
  if (initial?.lapsMs && initial.lapsMs.length > 0) {
    laps = initial.lapsMs.map((ms, index) => {
      const sectors = initial.lapsSectorsMs?.[index] ?? null;
      return {
        lapTime: formatMsToInput(ms),
        s1: formatMsToInput(sectors?.sector1Ms),
        s2: formatMsToInput(sectors?.sector2Ms),
        s3: formatMsToInput(sectors?.sector3Ms),
      };
    });
  } else if (initial?.bestLapMs != null && Number.isFinite(initial.bestLapMs)) {
    laps = [
      { lapTime: formatMsToInput(initial.bestLapMs), s1: "", s2: "", s3: "" },
    ];
  } else {
    laps = [{ lapTime: "", s1: "", s2: "", s3: "" }];
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
    totalDrivers:
      initial?.totalDrivers != null ? String(initial.totalDrivers) : "",
    qualifyingPosition:
      initial?.qualifyingPosition != null
        ? String(initial.qualifyingPosition)
        : "",
    laps,
    notes: initial?.notes ?? "",
    conditions:
      initial?.conditions === "DRY" ||
      initial?.conditions === "WET" ||
      initial?.conditions === "MIXED"
        ? initial.conditions
        : "DRY",
  };
}

interface ManualActivityFormV2Props {
  initialData?: ManualActivityEditInitialData;
  prefilledFromPrevious?: boolean;
  hideRecentSessions?: boolean;
  onSubmit: (data: ManualActivityRequest) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export default function ManualActivityFormV2({
  initialData,
  prefilledFromPrevious = false,
  hideRecentSessions = false,
  onSubmit,
  submitLabel,
  submittingLabel,
  isSubmitting,
  errorMessage,
}: ManualActivityFormV2Props) {
  const telemetryMinLapRows = initialData?.telemetryMinLapRows ?? null;
  const lapsIsOutLap = initialData?.lapsIsOutLap ?? null;
  const lapsCanEditOutLap = initialData?.lapsCanEditOutLap ?? null;
  const activitySchema = useMemo(
    () => createManualActivityV2FormSchema(telemetryMinLapRows),
    [telemetryMinLapRows],
  );

  const [pendingRecent, setPendingRecent] = useState<{
    trackToken: string;
    trackName: string;
    carToken: string;
    carName: string;
  } | null>(null);

  const form = useForm<WithRootError<ManualActivityV2FormValues>>({
    resolver: zodResolver(activitySchema),
    defaultValues: buildDefaults(initialData),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "laps",
  });

  const formState = useFormState({ control: form.control });

  const sim = form.watch("sim") as ManualActivitySim | "";
  const sessionKind = form.watch("manualSessionKind");
  const conditions = form.watch("conditions");
  const lapsWatch = useWatch({ control: form.control, name: "laps" });

  /** Indices whose Total was last written by sector auto-calc (cleared when sectors go invalid). */
  const autoFilledLapTotalsRef = useRef<Set<number>>(new Set());

  // Form reset from challenge/prefill must not leave stale auto-fill marks that would wipe lapTime.
  useEffect(() => {
    autoFilledLapTotalsRef.current = new Set();
  }, [initialData]);

  useEffect(() => {
    const rows = lapsWatch ?? [];
    const autoFilled = autoFilledLapTotalsRef.current;

    // Drop stale indices after lap remove / length shrink.
    for (const idx of [...autoFilled]) {
      if (idx >= rows.length) autoFilled.delete(idx);
    }

    rows.forEach((row, index) => {
      const s1Ms = parseSectorTimeToMs(row?.s1 ?? "");
      const s2Ms = parseSectorTimeToMs(row?.s2 ?? "");
      const s3Ms = parseSectorTimeToMs(row?.s3 ?? "");
      const currentTotal = row?.lapTime ?? "";

      if (s1Ms != null && s2Ms != null && s3Ms != null) {
        const formatted = formatMsToLapTime(s1Ms + s2Ms + s3Ms);
        autoFilled.add(index);
        if (currentTotal !== formatted) {
          form.setValue(`laps.${index}.lapTime`, formatted, {
            shouldDirty: true,
            shouldValidate: false,
          });
        }
        return;
      }

      if (autoFilled.has(index)) {
        autoFilled.delete(index);
        if (currentTotal !== "") {
          form.setValue(`laps.${index}.lapTime`, "", {
            shouldDirty: true,
            shouldValidate: false,
          });
        }
      }
    });
  }, [lapsWatch, form]);

  const maxLapsForSim = effectiveManualLapMaxForForm(
    sim || "",
    telemetryMinLapRows ?? null,
  );
  const canAddLap =
    fields.length < maxLapsForSim && !Boolean(telemetryMinLapRows);
  const canRemoveLap =
    fields.length > 1 && !Boolean(telemetryMinLapRows);

  function removeLap(index: number) {
    const prev = autoFilledLapTotalsRef.current;
    const next = new Set<number>();
    for (const i of prev) {
      if (i < index) next.add(i);
      else if (i > index) next.add(i - 1);
    }
    autoFilledLapTotalsRef.current = next;
    remove(index);
  }

  const {
    tracks,
    cars,
    loading: catalogsLoading,
    error: catalogsError,
    retry: retryCatalogs,
  } = useCatalogs(sim || null);
  const { recent: recentItems, loading: recentLoading } =
    useRecentManualSessions({ enabled: !hideRecentSessions });

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
    const currentSim = form.getValues("sim");
    if (currentSim !== item.sim) {
      form.setValue("sim", item.sim);
      form.setValue("trackId", "");
      form.setValue("carId", "");
    }
    setPendingRecent({
      trackToken: item.trackId,
      trackName: item.trackName,
      carToken: item.carId ?? "",
      carName: item.carName ?? "—",
    });
  }

  async function handleValid(values: ManualActivityV2FormValues) {
    form.clearErrors("root");
    const positionNum = values.position.trim()
      ? parseInt(values.position, 10)
      : undefined;
    const totalDriversNum = values.totalDrivers.trim()
      ? parseInt(values.totalDrivers, 10)
      : undefined;

    const lapsOut = values.laps
      .map((r) => {
        const lapTimeMs = parseStrictManualLapTimeToMs(r.lapTime.trim());
        if (lapTimeMs == null) return null;
        return {
          lapTimeMs,
          sector1Ms: parseSectorTimeToMs(r.s1),
          sector2Ms: parseSectorTimeToMs(r.s2),
          sector3Ms: parseSectorTimeToMs(r.s3),
        };
      })
      .filter(
        (
          row,
        ): row is {
          lapTimeMs: number;
          sector1Ms: number | null;
          sector2Ms: number | null;
          sector3Ms: number | null;
        } => row != null,
      );

    if (lapsOut.length === 0) {
      form.setError("laps", {
        type: "manual",
        message: "At least one valid lap time is required",
      });
      return;
    }

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
      laps: lapsOut,
      notes: values.notes.trim() || undefined,
      conditions: values.conditions,
    });
  }

  const showRecent = !recentLoading && recentItems.length > 0;
  const showRecentSection =
    !hideRecentSessions &&
    (recentLoading || showRecent || prefilledFromPrevious);

  const lapsRootError = form.getFieldState("laps", formState).error;
  const lapsRootMessage =
    lapsRootError && typeof lapsRootError.message === "string"
      ? lapsRootError.message
      : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleValid)} className="space-y-5">
        {showRecentSection && (
          <section className="mb-2">
            <h2 className={SECTION_LABEL_CLASS}>Recent Combos</h2>
            {prefilledFromPrevious && (
              <p className="mt-3 rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container-high/50 px-3 py-2 text-xs text-v2-on-surface-variant">
                Pre-filled from your last log on this page.
              </p>
            )}
            {recentLoading && (
              <p className="mt-3 flex items-center gap-2 text-xs text-v2-on-surface-variant">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Loading recent sessions…
              </p>
            )}
            {showRecent && (
              <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {recentItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleRecentChipClick(item)}
                    disabled={isSubmitting}
                    title={getRecentChipLabel(item)}
                    className="whitespace-nowrap rounded-full border border-v2-outline-variant/40 bg-v2-surface-container px-4 py-2 font-v2-headline text-xs font-medium text-v2-on-surface transition-colors hover:border-v2-primary disabled:opacity-50"
                  >
                    {getRecentChipLabel(item)}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <FormBlock
          title="Session details"
          description="Choose your sim, track, and session type."
        >
          <FormField
            control={form.control}
            name="sim"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="sim" className={LABEL_CLASS}>
                  Sim / Game <span className="text-v2-primary">*</span>
                </FormLabel>
                <FormControl>
                  <V2NativeSelect
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
                  >
                    <option value="">Select sim…</option>
                    {MANUAL_ACTIVITY_SIMS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </V2NativeSelect>
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          {catalogsError && sim && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-v2-error/20 bg-v2-error/10 p-3">
              <p className="text-sm text-v2-error">{catalogsError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryCatalogs}
                className="border-v2-outline-variant/40 bg-transparent text-v2-on-surface hover:bg-v2-surface-container-high"
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
                <FormLabel htmlFor="track" className={LABEL_CLASS}>
                  Track <span className="text-v2-primary">*</span>
                  {catalogsLoading && sim && (
                    <span className="ml-2 font-normal normal-case tracking-normal text-v2-on-surface-variant">
                      <Loader2 className="mr-0.5 inline size-3 animate-spin align-middle" />
                      Loading…
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <V2NativeSelect
                    id="track"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting || !sim || catalogsLoading}
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
                  </V2NativeSelect>
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="car" className={LABEL_CLASS}>
                  Car{" "}
                  <span className="normal-case text-v2-on-surface-variant/70">
                    (optional)
                  </span>
                  {catalogsLoading && sim && (
                    <span className="ml-2 font-normal normal-case tracking-normal text-v2-on-surface-variant">
                      <Loader2 className="mr-0.5 inline size-3 animate-spin align-middle" />
                      Loading…
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <V2NativeSelect
                    id="car"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting || !sim || catalogsLoading}
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
                  </V2NativeSelect>
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manualSessionKind"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>
                  Session type <span className="text-v2-primary">*</span>
                </FormLabel>
                <FormControl>
                  <div
                    className="grid grid-cols-3 gap-2"
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
                          className={pillClass(active)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Conditions</FormLabel>
                <FormControl>
                  <div
                    className="grid grid-cols-3 gap-2"
                    role="group"
                    aria-label="Track conditions"
                  >
                    {MANUAL_V2_CONDITIONS.map((option) => {
                      const active = (conditions || "DRY") === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => field.onChange(option.value)}
                          className={pillClass(active)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </FormBlock>

        <FormBlock
          title="Results"
          description={
            sessionKind === "PRACTICE"
              ? "Finishing position is not used for practice sessions."
              : "Optional — helps track wins, podiums, and grid position."
          }
        >
          <div className={sessionKind === "PRACTICE" ? "opacity-60" : ""}>
            <span className={LABEL_CLASS}>
              {sessionKind === "QUALIFY"
                ? "Qualifying position"
                : sessionKind === "RACE"
                  ? "Race finish"
                  : "Finishing position"}{" "}
              <span className="normal-case text-v2-on-surface-variant/70">
                ({sessionKind === "PRACTICE" ? "not used" : "optional"})
              </span>
            </span>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] sm:items-center sm:gap-2">
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
                    <FormMessage className="text-xs text-v2-error" />
                  </FormItem>
                )}
              />
              <span className="font-v2-headline text-[11px] font-bold uppercase tracking-wider text-v2-on-surface-variant sm:text-center">
                of
              </span>
              <div className="flex items-center gap-2">
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
                      <FormMessage className="text-xs text-v2-error" />
                    </FormItem>
                  )}
                />
                <span className="shrink-0 font-v2-headline text-[11px] font-bold uppercase tracking-wider text-v2-on-surface-variant">
                  drivers
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-v2-on-surface-variant/60">
              {sessionKind === "PRACTICE"
                ? "Practice sessions do not use finishing position."
                : sessionKind === "QUALIFY"
                  ? "Your position after qualifying. Leave empty if unknown."
                  : "Your race result. Leave empty if unknown."}
            </p>
          </div>

          {sessionKind === "RACE" && (
            <div>
              <span className={LABEL_CLASS}>
                Qualifying position{" "}
                <span className="normal-case text-v2-on-surface-variant/70">
                  (optional)
                </span>
              </span>
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
                    <FormMessage className="text-xs text-v2-error" />
                  </FormItem>
                )}
              />
              <p className="mt-2 text-[11px] text-v2-on-surface-variant/60">
                Where you started on the grid (from qualifying).
              </p>
            </div>
          )}
        </FormBlock>

        <FormBlock
          title="Lap history"
          description={
            lapsIsOutLap?.some(Boolean)
              ? "Out laps are editable only when all sectors and driving telemetry are available. Locked rows preserve their recorded data."
              : "Add at least one valid lap time. Sector splits are optional."
          }
        >
          {/* Loveable-style monospace lap table: Lap | S1 | S2 | S3 | Total. */}
          <div className="overflow-hidden rounded-xl border border-v2-outline-variant/30 bg-v2-surface-container">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="border-b border-v2-outline-variant/30 bg-white/5">
                <tr className="font-v2-headline text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
                  <th className="w-[13%] px-2 py-2.5">Lap</th>
                  <th className="px-1 py-2.5 text-center">
                    S1 <span className="font-normal opacity-50">(opt)</span>
                  </th>
                  <th className="px-1 py-2.5 text-center">
                    S2 <span className="font-normal opacity-50">(opt)</span>
                  </th>
                  <th className="px-1 py-2.5 text-center">
                    S3 <span className="font-normal opacity-50">(opt)</span>
                  </th>
                  <th className="px-2 py-2.5 text-right">Total</th>
                  {canRemoveLap && <th className="w-[9%] px-1 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {fields.map((fieldItem, index) => {
                  const row = lapsWatch?.[index];
                  const isOutLap = lapsIsOutLap?.[index] === true;
                  const canEditOutLap =
                    isOutLap && lapsCanEditOutLap?.[index] === true;
                  const lockedOutLap = isOutLap && !canEditOutLap;
                  const rawTotal = row?.lapTime ?? "";
                  const totalInvalid =
                    !lockedOutLap &&
                    rawTotal.trim() !== "" &&
                    parseStrictManualLapTimeToMs(rawTotal) === null;
                  return (
                    <tr
                      key={fieldItem.id}
                      className={
                        lockedOutLap
                          ? "border-b border-l-2 border-b-v2-outline-variant/15 border-l-v2-outline-variant/60 bg-v2-surface-container-high/70 text-v2-on-surface-variant/50 last:border-b-0"
                          : "border-b border-v2-outline-variant/15 last:border-b-0"
                      }
                    >
                      <td className="p-3 align-middle font-v2-headline text-sm font-bold text-v2-on-surface">
                        <span className="inline-flex flex-col gap-0.5">
                          {String(index + 1).padStart(2, "0")}
                          {isOutLap ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 font-v2-body text-[9px] font-semibold uppercase tracking-wider",
                                lockedOutLap
                                  ? "text-v2-on-surface-variant/60"
                                  : "text-v2-on-surface-variant",
                              )}
                              title={
                                lockedOutLap
                                  ? "Locked: sectors and driving telemetry are incomplete"
                                  : "Editable: sectors and driving telemetry are available"
                              }
                            >
                              {lockedOutLap ? (
                                <Lock className="size-2.5" aria-hidden />
                              ) : null}
                              {lockedOutLap ? "Out · Locked" : "Out"}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      {(["s1", "s2", "s3"] as const).map((sector) => {
                        const sRaw = row?.[sector] ?? "";
                        const sInvalid =
                          !lockedOutLap &&
                          sRaw.trim() !== "" &&
                          !isValidSectorTimeFormat(sRaw);
                        return (
                          <td key={sector} className="p-3 align-middle">
                            <FormField
                              control={form.control}
                              name={`laps.${index}.${sector}`}
                              render={({ field }) => (
                                <LapTableCellField
                                  field={field}
                                  displayClassName={CELL_SECTOR_CLASS}
                                  placeholder="--.---"
                                  ariaLabel={`Lap ${index + 1} sector ${sector.toUpperCase()}`}
                                  disabled={isSubmitting || lockedOutLap}
                                  invalid={sInvalid}
                                />
                              )}
                            />
                          </td>
                        );
                      })}
                      <td className="p-3 align-middle">
                        <FormField
                          control={form.control}
                          name={`laps.${index}.lapTime`}
                          render={({ field }) => (
                            <LapTableCellField
                              field={field}
                              displayClassName={CELL_TOTAL_CLASS}
                              placeholder="0:00.000"
                              ariaLabel={`Lap ${index + 1} total time`}
                              disabled={isSubmitting || lockedOutLap}
                              align="right"
                              invalid={totalInvalid}
                            />
                          )}
                        />
                      </td>
                      {canRemoveLap && (
                        <td className="p-1 text-center align-middle">
                          <button
                            type="button"
                            disabled={isSubmitting || lockedOutLap}
                            onClick={() => removeLap(index)}
                            aria-label={`Remove lap ${index + 1}`}
                            className="text-v2-on-surface-variant transition-colors hover:text-v2-error disabled:opacity-50"
                          >
                            <Trash2 className="mx-auto size-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              type="button"
              disabled={isSubmitting || !canAddLap || Boolean(telemetryMinLapRows)}
              onClick={() => append({ lapTime: "", s1: "", s2: "", s3: "" })}
              className="flex w-full items-center justify-center gap-2 border-t border-v2-outline-variant/30 py-3 font-v2-headline text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant transition-colors hover:text-v2-on-surface disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
              Add lap
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-v2-on-surface-variant/60">
            <span>Format: m:ss.mmm or ss.mmm (e.g. 1:32.456)</span>
            <span>
              {sim
                ? `Max ${maxLapsForSim} · ${fields.length} row${fields.length === 1 ? "" : "s"}`
                : "Select sim for limit"}
            </span>
          </div>

          {lapsRootMessage && (
            <p className="text-xs text-v2-error">{lapsRootMessage}</p>
          )}
          {fields.map((fieldItem, index) => {
            const totalErr = form.getFieldState(
              `laps.${index}.lapTime`,
              formState,
            ).error;
            const sectorErr = (["s1", "s2", "s3"] as const)
              .map(
                (sector) =>
                  form.getFieldState(`laps.${index}.${sector}`, formState).error
                    ?.message,
              )
              .find((m): m is string => typeof m === "string");
            const message =
              (typeof totalErr?.message === "string" && totalErr.message) ||
              sectorErr;
            if (!message) return null;
            return (
              <p key={fieldItem.id} className="text-xs text-v2-error">
                Lap {index + 1}: {message}
              </p>
            );
          })}
        </FormBlock>

        <FormBlock
          title="Notes"
          description="Anything else to remember about this session."
        >
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="notes" className="sr-only">
                  Notes (optional)
                </FormLabel>
                <FormControl>
                  <textarea
                    id="notes"
                    disabled={isSubmitting}
                    placeholder="Setup changes, weather, incidents, strategy…"
                    rows={4}
                    className={v2ManualTextareaClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-v2-error" />
              </FormItem>
            )}
          />
        </FormBlock>

        {formState.errors.root?.message ? (
          <div className="flex items-start gap-2 rounded-lg border border-v2-error/20 bg-v2-error/10 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-v2-error" />
            <FormRootMessage className="flex-1 text-sm text-v2-error" />
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(v2PrimaryButtonClassName, "w-full rounded-[0.5rem]")}
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
      </form>
    </Form>
  );
}
