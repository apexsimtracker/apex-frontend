import { useState, useEffect, useCallback } from "react";
import { getCatalogs, type CatalogTrack, type CatalogCar } from "@/lib/api";

const cache = new Map<
  string,
  { tracks: CatalogTrack[]; cars: CatalogCar[] }
>();

export type UseCatalogsResult = {
  tracks: CatalogTrack[];
  cars: CatalogCar[];
  loading: boolean;
  error: string | null;
  retry: () => void;
};

export function useCatalogs(sim: string | null): UseCatalogsResult {
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [cars, setCars] = useState<CatalogCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async (simKey: string) => {
    const cached = cache.get(simKey);
    if (cached) {
      setTracks(cached.tracks);
      setCars(cached.cars);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCatalogs(simKey);
      const tracksList = Array.isArray(data.tracks) ? data.tracks : [];
      const carsList = Array.isArray(data.cars) ? data.cars : [];
      cache.set(simKey, { tracks: tracksList, cars: carsList });
      setTracks(tracksList);
      setCars(carsList);
    } catch {
      setError("Failed to load track/car list.");
      setTracks([]);
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (sim) {
      cache.delete(sim);
      void fetchCatalogs(sim);
    }
  }, [sim, fetchCatalogs]);

  useEffect(() => {
    if (!sim || sim.trim() === "") {
      setTracks([]);
      setCars([]);
      setLoading(false);
      setError(null);
      return;
    }
    void fetchCatalogs(sim);
  }, [sim, fetchCatalogs]);

  return { tracks, cars, loading, error, retry };
}
