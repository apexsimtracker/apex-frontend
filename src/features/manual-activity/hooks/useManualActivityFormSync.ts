import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  effectiveManualLapMaxForForm,
  type ManualActivityFormValues,
} from "@/lib/validation/manualActivity";

type InitialData = {
  catalogTrackId?: string | null;
  trackId?: string | null;
  trackNameHint?: string | null;
  catalogCarId?: string | null;
  carId?: string | null;
  carNameHint?: string | null;
} | null | undefined;

export function useManualActivityFormSync(options: {
  initialData?: InitialData;
  errorMessage: string | null;
  form: UseFormReturn<any>;
  sim: string;
  telemetryMinLapRows: number | null;
  tracks: { id: string; name: string }[];
  cars: { id: string; name: string }[];
  pendingRecent: {
    trackToken: string;
    trackName: string;
    carToken: string;
    carName: string;
  } | null;
  setPendingRecent: (v: {
    trackToken: string;
    trackName: string;
    carToken: string;
    carName: string;
  } | null) => void;
  buildDefaults: (data?: any) => any;
  resolveCatalogTrackId: (
    catalog: { id: string; name: string }[],
    storedToken: string,
    nameHint: string | null | undefined
  ) => string;
  resolveCatalogCarId: (
    catalog: { id: string; name: string }[],
    storedToken: string,
    nameHint: string | null | undefined
  ) => string;
}) {
  const {
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
  } = options;

  const trackToken = initialData?.catalogTrackId ?? initialData?.trackId ?? "";
  const trackNameHint = initialData?.trackNameHint;
  const carToken = initialData?.catalogCarId ?? initialData?.carId ?? "";
  const carNameHint = initialData?.carNameHint;

  useEffect(() => {
    if (initialData) {
      form.reset(buildDefaults(initialData));
    }
  }, [initialData, form, buildDefaults]);

  useEffect(() => {
    if (errorMessage) {
      form.setError("root", { type: "server", message: errorMessage });
    } else {
      form.clearErrors("root");
    }
  }, [errorMessage, form]);

  useEffect(() => {
    if (!sim) return;
    const max = effectiveManualLapMaxForForm(sim, telemetryMinLapRows ?? null);
    const current = form.getValues("laps") as ManualActivityFormValues["laps"];
    if (Array.isArray(current) && current.length > max) {
      form.setValue("laps", current.slice(0, max), { shouldValidate: true });
    }
  }, [sim, form, telemetryMinLapRows]);

  useEffect(() => {
    if (!sim || tracks.length === 0) return;
    const current = form.getValues("trackId") as string;
    if (current && tracks.some((t) => t.id === current)) return;
    const resolved = resolveCatalogTrackId(
      tracks,
      trackToken,
      trackNameHint
    );
    if (resolved) {
      form.setValue("trackId", resolved, { shouldValidate: true });
      return;
    }
    const stored = trackToken?.trim() ?? "";
    // Stored token not in catalog (e.g. .ibt ingest): keep it so edits don't wipe the session.
    if (stored && current === stored) return;
    if (current) {
      form.setValue("trackId", "", { shouldValidate: true });
    }
  }, [
    sim,
    tracks,
    trackToken,
    trackNameHint,
    form,
    resolveCatalogTrackId,
  ]);

  useEffect(() => {
    if (!sim || cars.length === 0) return;
    const current = form.getValues("carId") as string;
    if (current && cars.some((c) => c.id === current)) return;
    const resolved = resolveCatalogCarId(
      cars,
      carToken,
      carNameHint
    );
    if (resolved) {
      form.setValue("carId", resolved, { shouldValidate: true });
      return;
    }
    const stored = carToken?.trim() ?? "";
    if (stored && current === stored) return;
    if (current) {
      form.setValue("carId", "", { shouldValidate: true });
    }
  }, [
    sim,
    cars,
    carToken,
    carNameHint,
    form,
    resolveCatalogCarId,
  ]);

  useEffect(() => {
    if (!pendingRecent || tracks.length === 0) return;
    const trackResolved = resolveCatalogTrackId(
      tracks,
      pendingRecent.trackToken,
      pendingRecent.trackName
    );
    if (trackResolved) form.setValue("trackId", trackResolved);
    if (cars.length > 0) {
      const carResolved = resolveCatalogCarId(
        cars,
        pendingRecent.carToken,
        pendingRecent.carName !== "—" ? pendingRecent.carName : null
      );
      if (carResolved) form.setValue("carId", carResolved);
    }
    setPendingRecent(null);
  }, [
    pendingRecent,
    tracks,
    cars,
    form,
    setPendingRecent,
    resolveCatalogTrackId,
    resolveCatalogCarId,
  ]);
}

