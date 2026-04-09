import { useState, useEffect } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MANUAL_ACTIVITY_SIMS, type ManualActivitySim } from "@/lib/manualActivityData";
import { parseLapTimeToMs, formatMsToLapTime } from "@/lib/utils";
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
  type ManualActivityFormValues,
} from "@/lib/validation/manualActivity";

export type ManualActivityFormData = {
  sim: ManualActivitySim | "";
  trackId: string;
  carId: string;
  position: string;
  totalDrivers: string;
  bestLapTime: string;
  notes: string;
};

export type ManualActivityInitialData = {
  sim?: string | null;
  trackId?: string | null;
  carId?: string | null;
  position?: number | null;
  totalDrivers?: number | null;
  bestLapMs?: number | null;
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
  return {
    sim: (initial?.sim as string) || "",
    trackId: initial?.trackId ?? "",
    carId: initial?.carId ?? "",
    position: initial?.position != null ? String(initial.position) : "",
    totalDrivers: initial?.totalDrivers != null ? String(initial.totalDrivers) : "",
    bestLapTime: formatMsToInput(initial?.bestLapMs),
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

  const { errors: formErrors } = useFormState({ control: form.control });

  const sim = form.watch("sim") as ManualActivitySim | "";
  const trackId = form.watch("trackId");
  const carId = form.watch("carId");
  const bestLapTime = form.watch("bestLapTime");

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

  const parsedBestLapMs = bestLapTime.trim() ? parseLapTimeToMs(bestLapTime) : null;
  const lapTimeInvalid = bestLapTime.trim() !== "" && parsedBestLapMs === null;
  const showSavedPreview =
    bestLapTime.trim() && parsedBestLapMs != null && !form.formState.errors.bestLapTime;

  async function handleValid(values: ManualActivityFormValues) {
    form.clearErrors("root");
    const positionNum = values.position.trim() ? parseInt(values.position, 10) : undefined;
    const totalDriversNum = values.totalDrivers.trim()
      ? parseInt(values.totalDrivers, 10)
      : undefined;
    const bestLapMs = parseLapTimeToMs(values.bestLapTime) ?? undefined;

    await onSubmit({
      sim: values.sim,
      trackId: values.trackId,
      carId: values.carId || undefined,
      position: positionNum,
      totalDrivers: totalDriversNum,
      bestLapMs,
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
            <p className="text-xs font-medium text-white/50 mb-2">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recentItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleRecentChipClick(item)}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors disabled:opacity-50"
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
                  <span className="ml-2 text-xs text-white/50 font-normal">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-0.5 align-middle" />
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
                  <span className="ml-2 text-xs text-white/50 font-normal">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-0.5 align-middle" />
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
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Finishing position <span className="text-white/40">(optional)</span>
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] gap-2 items-start w-full">
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
            <span className="text-xs text-white/60 text-center mt-3">out of</span>
            <div className="flex gap-1">
              <FormField
                control={form.control}
                name="totalDrivers"
                render={({ field }) => (
                  <FormItem className="space-y-0 flex-1">
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
              <span className="text-xs text-white/60 shrink-0 mt-3">drivers</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-white/40">
            Optional for races. Leave both fields empty for practice activities.
          </p>
        </div>

        <FormField
          control={form.control}
          name="bestLapTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="bestLapTime" className="text-white/80">
                Best Lap Time <span className="text-white/40">(optional)</span>
              </FormLabel>
              <FormControl>
                <input
                  id="bestLapTime"
                  type="text"
                  disabled={isSubmitting}
                  placeholder="mm:ss.mmm (e.g. 1:32.456, 92.456, 0:59.900)"
                  className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0 disabled:opacity-50 ${
                    lapTimeInvalid
                      ? "border-red-500/50 focus:border-red-500/50"
                      : "border-white/10 focus:border-white/20"
                  }`}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
              {showSavedPreview && parsedBestLapMs != null && (
                <p className="mt-1 text-xs text-white/50">
                  Saved as {formatMsToLapTime(parsedBestLapMs)}
                </p>
              )}
            </FormItem>
          )}
        />

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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 resize-none disabled:opacity-50"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        {formErrors.root?.message ? (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
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
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
