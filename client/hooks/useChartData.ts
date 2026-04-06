import { useState, useEffect, useCallback } from "react";
import { isProRequiredError } from "@/lib/api";

export type ChartState = "loading" | "ready" | "preview" | "gated" | "error";

export type ChartAccess = "FULL" | "PREVIEW";

export interface ChartPreviewData {
  lapsCount: number;
  bestLapMs: number | null;
  avgLapMs: number | null;
}

export interface UseChartDataResult<T> {
  data: T | null;
  state: ChartState;
  error: string | null;
  preview: ChartPreviewData | null;
  refetch: () => void;
}

interface ChartResponseWithAccess {
  access?: ChartAccess;
  preview?: ChartPreviewData;
}

function hasAccessField(obj: unknown): obj is ChartResponseWithAccess {
  return typeof obj === "object" && obj !== null && "access" in obj;
}

export function useChartData<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): UseChartDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<ChartState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ChartPreviewData | null>(null);

  const fetch = useCallback(async () => {
    setState("loading");
    setError(null);
    setPreview(null);

    try {
      const result = await fetchFn();

      if (hasAccessField(result) && result.access === "PREVIEW") {
        setState("preview");
        setData(null);
        setPreview(result.preview ?? null);
      } else {
        setData(result);
        setState("ready");
      }
    } catch (err) {
      if (isProRequiredError(err)) {
        setState("gated");
        setData(null);
      } else {
        setState("error");
        setError(err instanceof Error ? err.message : "Failed to load chart data");
        setData(null);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    fetch();
  }, [...deps, fetch]);

  return { data, state, error, preview, refetch: fetch };
}

export function isChartGated(state: ChartState): state is "gated" {
  return state === "gated";
}

export function isChartLoading(state: ChartState): state is "loading" {
  return state === "loading";
}

export function isChartError(state: ChartState): state is "error" {
  return state === "error";
}

export function isChartReady(state: ChartState): state is "ready" {
  return state === "ready";
}

export function isChartPreview(state: ChartState): state is "preview" {
  return state === "preview";
}
