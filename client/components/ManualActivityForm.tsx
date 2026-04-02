import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MANUAL_ACTIVITY_SIMS, type ManualActivitySim } from "@/lib/manualActivityData";
import {
  parseLapTimeToMs,
  formatMsToLapTime,
} from "@/lib/utils";
import { useCatalogs } from "@/hooks/useCatalogs";
import {
  useRecentManualSessions,
  getRecentChipLabel,
  type RecentManualItem,
} from "@/hooks/useRecentManualSessions";

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
  /** When true, show helper text "Based on a previous activity." */
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

export default function ManualActivityForm({
  initialData,
  prefilledFromPrevious = false,
  onSubmit,
  submitLabel,
  submittingLabel,
  isSubmitting,
  errorMessage,
}: ManualActivityFormProps) {
  const [sim, setSim] = useState<ManualActivitySim | "">(
    (initialData?.sim as ManualActivitySim) || ""
  );
  const [trackId, setTrackId] = useState(initialData?.trackId ?? "");
  const [carId, setCarId] = useState(initialData?.carId ?? "");
  const [position, setPosition] = useState(
    initialData?.position != null ? String(initialData.position) : ""
  );
  const [totalDrivers, setTotalDrivers] = useState(
    initialData?.totalDrivers != null ? String(initialData.totalDrivers) : ""
  );
  const [bestLapTime, setBestLapTime] = useState(
    formatMsToInput(initialData?.bestLapMs)
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [lapTimeError, setLapTimeError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingRecent, setPendingRecent] = useState<{
    trackName: string;
    carName: string;
  } | null>(null);

  const { tracks, cars, loading: catalogsLoading, error: catalogsError, retry: retryCatalogs } = useCatalogs(sim || null);
  const { recent: recentItems, loading: recentLoading } = useRecentManualSessions();

  useEffect(() => {
    if (initialData) {
      setSim((initialData.sim as ManualActivitySim) || "");
      setTrackId(initialData.trackId ?? "");
      setCarId(initialData.carId ?? "");
      setPosition(
        initialData.position != null ? String(initialData.position) : ""
      );
      setTotalDrivers(
        initialData.totalDrivers != null ? String(initialData.totalDrivers) : ""
      );
      setBestLapTime(formatMsToInput(initialData.bestLapMs));
      setNotes(initialData.notes ?? "");
    }
  }, [initialData]);

  useEffect(() => {
    if (tracks.length > 0 && trackId && !tracks.some((t) => t.id === trackId)) {
      setTrackId("");
    }
    if (cars.length > 0 && carId && !cars.some((c) => c.id === carId)) {
      setCarId("");
    }
  }, [tracks, cars, trackId, carId]);

  useEffect(() => {
    if (!pendingRecent || tracks.length === 0) return;
    const byTrackName = tracks.find(
      (t) => t.name.trim().toLowerCase() === pendingRecent.trackName.trim().toLowerCase()
    );
    const byCarName =
      pendingRecent.carName && pendingRecent.carName !== "—"
        ? cars.find(
            (c) =>
              c.name.trim().toLowerCase() === pendingRecent.carName.trim().toLowerCase()
          )
        : null;
    if (byTrackName) setTrackId(byTrackName.id);
    if (byCarName) setCarId(byCarName.id);
    setPendingRecent(null);
  }, [pendingRecent, tracks, cars]);

  function handleSimChange(value: string) {
    setSim(value as ManualActivitySim | "");
    setTrackId("");
    setCarId("");
    setPendingRecent(null);
  }

  function handleRecentChipClick(item: RecentManualItem) {
    setSim(item.sim as ManualActivitySim);
    setTrackId(item.trackId);
    setCarId(item.carId ?? "");
    setPendingRecent({
      trackName: item.trackName,
      carName: item.carName ?? "—",
    });
  }

  function handleLapTimeBlur() {
    if (!bestLapTime.trim()) {
      setLapTimeError(null);
      return;
    }

    const parsed = parseLapTimeToMs(bestLapTime);
    if (parsed === null) {
      setLapTimeError(
        "Invalid format. Use mm:ss.mmm (e.g. 1:32.456, 92.456, 0:59.900)"
      );
    } else {
      setLapTimeError(null);
    }
  }

  const parsedBestLapMs =
    bestLapTime.trim() ? parseLapTimeToMs(bestLapTime) : null;
  const showSavedPreview =
    bestLapTime.trim() && parsedBestLapMs != null && !lapTimeError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!sim || !trackId) {
      setLocalError("Sim and Track are required.");
      return;
    }

    const positionNum = position ? parseInt(position, 10) : undefined;
    const totalDriversNum = totalDrivers ? parseInt(totalDrivers, 10) : undefined;

    if (position && (!Number.isInteger(positionNum) || positionNum! < 1)) {
      setLocalError("Position must be at least 1.");
      return;
    }
    if (totalDrivers && (!Number.isInteger(totalDriversNum) || totalDriversNum! < 1)) {
      setLocalError("Grid size must be at least 1 driver.");
      return;
    }
    if (
      (positionNum != null && totalDriversNum == null) ||
      (positionNum == null && totalDriversNum != null)
    ) {
      setLocalError("Please enter both position and grid size, or leave both empty.");
      return;
    }
    if (
      positionNum != null &&
      totalDriversNum != null &&
      positionNum > totalDriversNum
    ) {
      setLocalError("Position cannot be greater than the total number of drivers.");
      return;
    }

    const bestLapMs = parseLapTimeToMs(bestLapTime) ?? undefined;
    if (bestLapTime.trim() && bestLapMs === undefined) {
      setLapTimeError(
        "Invalid format. Use mm:ss.mmm (e.g. 1:32.456, 92.456, 0:59.900)"
      );
      return;
    }

    await onSubmit({
      sim,
      trackId,
      carId: carId || undefined,
      position: positionNum,
      totalDrivers: totalDriversNum,
      bestLapMs,
      notes: notes.trim() || undefined,
    });
  }

  const displayError = errorMessage || localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {prefilledFromPrevious && (
        <p className="text-xs text-white/50">
          Based on a previous activity.
        </p>
      )}

      {/* Recent quick-select */}
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

      {/* Sim/Game */}
      <div>
        <label
          htmlFor="sim"
          className="block text-sm font-medium text-white/80 mb-1.5"
        >
          Sim / Game <span className="text-red-400">*</span>
        </label>
        <select
          id="sim"
          value={sim}
          onChange={(e) => handleSimChange(e.target.value)}
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
      </div>

      {/* Catalogs error + retry */}
      {catalogsError && sim && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{catalogsError}</p>
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

      {/* Track */}
      <div>
        <label
          htmlFor="track"
          className="block text-sm font-medium text-white/80 mb-1.5"
        >
          Track <span className="text-red-400">*</span>
          {catalogsLoading && sim && (
            <span className="ml-2 text-xs text-white/50 font-normal">
              <Loader2 className="inline h-3 w-3 animate-spin mr-0.5 align-middle" />
              Loading…
            </span>
          )}
        </label>
        <select
          id="track"
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
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
      </div>

      {/* Car (Optional) */}
      <div>
        <label
          htmlFor="car"
          className="block text-sm font-medium text-white/80 mb-1.5"
        >
          Car <span className="text-white/40">(optional)</span>
          {catalogsLoading && sim && (
            <span className="ml-2 text-xs text-white/50 font-normal">
              <Loader2 className="inline h-3 w-3 animate-spin mr-0.5 align-middle" />
              Loading…
            </span>
          )}
        </label>
        <select
          id="car"
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
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
      </div>

      {/* Position / Grid (Optional) */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1.5">
          Finishing position <span className="text-white/40">(optional)</span>
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] gap-2 items-center w-full">
          <input
            id="position"
            type="number"
            min={1}
            inputMode="numeric"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={isSubmitting}
            placeholder="7"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
          />
          <span className="text-xs text-white/60 text-center">out of</span>
          <div className="flex items-center gap-1">
            <input
              id="totalDrivers"
              type="number"
              min={1}
              inputMode="numeric"
              value={totalDrivers}
              onChange={(e) => setTotalDrivers(e.target.value)}
              disabled={isSubmitting}
              placeholder="20"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
            <span className="text-xs text-white/60 shrink-0">drivers</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-white/40">
          Optional for races. Leave both fields empty for practice activities.
        </p>
      </div>

      {/* Best Lap Time (Optional) */}
      <div>
        <label
          htmlFor="bestLapTime"
          className="block text-sm font-medium text-white/80 mb-1.5"
        >
          Best Lap Time <span className="text-white/40">(optional)</span>
        </label>
        <input
          id="bestLapTime"
          type="text"
          value={bestLapTime}
          onChange={(e) => setBestLapTime(e.target.value)}
          onBlur={handleLapTimeBlur}
          disabled={isSubmitting}
          placeholder="mm:ss.mmm (e.g. 1:32.456, 92.456, 0:59.900)"
          className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0 disabled:opacity-50 ${
            lapTimeError
              ? "border-red-500/50 focus:border-red-500/50"
              : "border-white/10 focus:border-white/20"
          }`}
        />
        {lapTimeError && (
          <p className="mt-1 text-xs text-red-400">{lapTimeError}</p>
        )}
        {showSavedPreview && parsedBestLapMs != null && (
          <p className="mt-1 text-xs text-white/50">
            Saved as {formatMsToLapTime(parsedBestLapMs)}
          </p>
        )}
      </div>

      {/* Notes (Optional) */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-white/80 mb-1.5"
        >
          Notes <span className="text-white/40">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          placeholder="Any notes about this session…"
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none focus:ring-0 resize-none disabled:opacity-50"
        />
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{displayError}</p>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={
          isSubmitting ||
          !sim ||
          !trackId ||
          !!lapTimeError ||
          (bestLapTime.trim() !== "" && parsedBestLapMs === null)
        }
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
  );
}

