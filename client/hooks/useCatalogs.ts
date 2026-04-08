import { useQuery } from "@tanstack/react-query";
import { getCatalogs, type CatalogTrack, type CatalogCar } from "@/lib/api";

export type UseCatalogsResult = {
  tracks: CatalogTrack[];
  cars: CatalogCar[];
  loading: boolean;
  error: string | null;
  retry: () => void;
};

export function useCatalogs(sim: string | null): UseCatalogsResult {
  const trimmed = sim?.trim() ?? "";
  const enabled = trimmed.length > 0;

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["catalogs", trimmed],
    queryFn: async () => {
      const data = await getCatalogs(trimmed);
      const tracksList = Array.isArray(data.tracks) ? data.tracks : [];
      const carsList = Array.isArray(data.cars) ? data.cars : [];
      return { tracks: tracksList, cars: carsList };
    },
    enabled,
  });

  const retry = () => {
    void refetch();
  };

  if (!enabled) {
    return {
      tracks: [],
      cars: [],
      loading: false,
      error: null,
      retry,
    };
  }

  return {
    tracks: data?.tracks ?? [],
    cars: data?.cars ?? [],
    loading: isPending,
    error: error ? "Failed to load track/car list." : null,
    retry,
  };
}
