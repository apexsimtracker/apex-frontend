import { useState, useEffect } from "react";
import { useForm, useFormState, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
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
  manualActivityFormSchema,
  MANUAL_ACTIVITY_POSITION_MAX,
  MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX,
  getManualLapMaxForSim,
  getManualLapMaxForSimOrDefault,
  type ManualActivityFormValues,
} from "@/lib/validation/manualActivity";

export type ManualActivityFormData = {
  sim: ManualActivitySim | "";
  trackId: string;
  carId: string;
  position: string;
  totalDrivers: string;
  laps: { lapTime: string }[];
  notes: string;
};

export type ManualActivityInitialData = {
  sim?: string | null;
  trackId?: string | null;
  carId?: string | null;
  position?: number | null;
  totalDrivers?: number | null;
  /** @deprecated prefer lapsMs */
  bestLapMs?: number | null;
  /** Ordered lap times in ms (e.g. from session detail). */
  lapsMs?: number[] | null;
  notes?: string | null;
};

interface ManualActivityFormProps {
  initialData?: ManualActivityInitialData;
  prefilledFromPrevious?: boolean;
  onSubmit: (data: {
    sim: string;
    trackId: string;
    carId?: string;
    position?: number;
    totalDrivers?: number;
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

function buildDefaults(initial?: ManualActivityInitialData): ManualActivityFormValues {
  let laps: { lapTime: string }[];
  if (initial?.lapsMs && initial.lapsMs.length > 0) {
    laps = initial.lapsMs.map((ms) => ({ lapTime: formatMsToInput(ms) }));
  } else if (initial?.bestLapMs != null && Number.isFinite(initial.bestLapMs)) {
    laps = [{ lapTime: formatMsToInput(initial.bestLapMs) }];
  } else {
    laps = [{ lapTime: "" }];
  }
  return {
    sim: (initial?.sim as string) || "",
    trackId: initial?.trackId ?? "",
    carId: initial?.carId ?? "",
    position: initial?.position != null ? String(initial.position) : "",
    totalDrivers: initial?.totalDrivers != null ? String(initial.totalDrivers) : "",
    laps,
    notes: initial?.notes ?? "",
  };
}

export default function ManualActivityForm({
  initialData,
  prefilledFromPrevious = false,
  onSubmit,
  submitLabel,
  submittingLabel,
  isSubmitting,
  errorMessage,
}: ManualActivityFormProps) {
  const [pendingRecent, setPendingRecent] = useState<{
    trackName: string;
    carName: string;
  } | null>(null);

  const form = useForm<WithRootError<ManualActivityFormValues>>({
    resolver: zodResolver(manualActivityFormSchema),
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
  const trackId = form.watch("trackId");
  const carId = form.watch("carId");
  const lapsWatch = form.watch("laps");

  const maxLapsForSim = getManualLapMaxForSimOrDefault(sim);
  const canAddLap = fields.length < maxLapsForSim;
  const canRemoveLap = fields.length > 1;

  const { tracks, cars, loading: catalogsLoading, error: catalogsError, retry: retryCatalogs } =
    useCatalogs(sim || null);
  const { recent: recentItems, loading: recentLoading } = useRecentManualSessions();

  useEffect(() => {
    if (initialData) {
      form.reset(buildDefaults(initialData));
    }
  }, [initialData, form]);

  useEffect(() => {
    if (errorMessage) {
      form.setError("root", { type: "server", message: errorMessage });
    } else {
      form.clearErrors("root");
    }
  }, [errorMessage, form]);

  useEffect(() => {
    if (!sim) return;
    const max = getManualLapMaxForSim(sim);
    const current = form.getValues("laps");
    if (current.length > max) {
      form.setValue(
        "laps",
        current.slice(0, max),
        { shouldValidate: true }
      );
    }
  }, [sim, form]);

  useEffect(() => {
    if (tracks.length > 0 && trackId && !tracks.some((t) => t.id === trackId)) {
      form.setValue("trackId", "");
    }
    if (cars.length > 0 && carId && !cars.some((c) => c.id === carId)) {
      form.setValue("carId", "");
    }
  }, [tracks, cars, trackId, carId, form]);

  useEffect(() => {
    if (!pendingRecent || tracks.length === 0) return;
    const byTrackName = tracks.find(
      (t) => t.name.trim().toLowerCase() === pendingRecent.trackName.trim().toLowerCase()
    );
    const byCarName =
      pendingRecent.carName && pendingRecent.carName !== "—"
        ? cars.find(
            (c) => c.name.trim().toLowerCase() === pendingRecent.carName.trim().toLowerCase()
          )
        : null;
    if (byTrackName) form.setValue("trackId", byTrackName.id);
    if (byCarName) form.setValue("carId", byCarName.id);
    setPendingRecent(null);
  }, [pendingRecent, tracks, cars, form]);

  function handleRecentChipClick(item: RecentManualItem) {
    form.setValue("sim", item.sim);
    form.setValue("trackId", item.trackId);
    form.setValue("carId", item.carId ?? "");
    setPendingRecent({
      trackName: item.trackName,
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

    const lapsOut = lapTimesMs.map((lapTimeMs) => ({ lapTimeMs }));
    const bestLapMs =
      lapTimesMs.length > 0 ? Math.min(...lapTimesMs) : undefined;

    await onSubmit({
      sim: values.sim,
      trackId: values.trackId,
      carId: values.carId || undefined,
      position: positionNum,
      totalDrivers: totalDriversNum,
      ...(lapsOut.length > 0
        ? { laps: lapsOut, bestLapMs }
        : {}),
      notes: values.notes.trim() || undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        {prefilledFromPrevious && (
          <p className="text-xs text-white/50">Based on a previous activity.</p>
        )}

        {!recentLoading && recentItems.length > 0 && !catalogsLoading && (
          <div>
            <p className="mb-2 text-xs font-medium text-white/50">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recentItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleRecentChipClick(item)}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white/90 disabled:opacity-50"
                >
                  {getRecentChipLabel(item)}
                </button>
              ))}
            </div>
          </div>
        )}

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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
                >
                  <option value="">
                    {!sim
                      ? "Select a sim first"
                      : catalogsLoading
                        ? "Loading…"
                        : "Select track…"}
                  </option>
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
                >
                  <option value="">
                    {!sim
                      ? "Select a sim first"
                      : catalogsLoading
                        ? "Loading…"
                        : "Select car…"}
                  </option>
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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            Finishing position <span className="text-white/40">(optional)</span>
          </label>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] items-start gap-2">
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
                      disabled={isSubmitting}
                      placeholder="7"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
            <span className="mt-3 text-center text-xs text-white/60">out of</span>
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
                        disabled={isSubmitting}
                        placeholder="20"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <span className="mt-3 shrink-0 text-xs text-white/60">drivers</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-white/40">
            Optional for races. Leave both fields empty for practice activities.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <FormLabel className="text-white/80">
              Laps <span className="text-white/40">(optional)</span>
            </FormLabel>
            <span className="text-xs text-white/40">
              {sim ? `Max ${maxLapsForSim} · ${fields.length} row${fields.length === 1 ? "" : "s"}` : "Select sim for limit"}
            </span>
          </div>
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
                  <FormItem>
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
                            className={`mt-1 w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0 disabled:opacity-50 ${
                              lapInvalid
                                ? "border-red-500/50 focus:border-red-500/50"
                                : "border-white/10 focus:border-white/20"
                            }`}
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
                          className="mt-6 shrink-0 border-white/20 text-white/80 hover:bg-white/10"
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="notes" className="text-white/80">
                Notes <span className="text-white/40">(optional)</span>
              </FormLabel>
              <FormControl>
                <textarea
                  id="notes"
                  disabled={isSubmitting}
                  placeholder="Any notes about this session…"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        {formErrors.root?.message ? (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
            <FormRootMessage className="flex-1" />
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
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
      </form>
    </Form>
  );
}
