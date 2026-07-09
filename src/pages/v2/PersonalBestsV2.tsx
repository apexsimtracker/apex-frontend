import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import PageMeta from "@/components/PageMeta";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { COMPANY_NAME } from "@/lib/siteMeta";
import {
  getPersonalBests,
  getPersonalBestsFilterOptions,
  isProRequiredError,
} from "@/lib/api";
import { useIsProUser } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import PersonalBestsProLockedV2 from "./personal-bests/PersonalBestsProLockedV2";
import PersonalBestsSummaryV2 from "./personal-bests/PersonalBestsSummaryV2";
import PersonalBestsListV2 from "./personal-bests/PersonalBestsListV2";
import PersonalBestsSkeletonV2 from "./personal-bests/PersonalBestsSkeletonV2";
import PersonalBestsEmptyV2 from "./personal-bests/PersonalBestsEmptyV2";
import PersonalBestsFiltersV2 from "./personal-bests/PersonalBestsFiltersV2";
import PersonalBestsPaginationV2 from "./personal-bests/PersonalBestsPaginationV2";

const PERSONAL_BESTS_V2_PATH = "/v2/personal-bests";
const title = `Personal bests | ${COMPANY_NAME}`;
const description = `Track your best qualifying laps per track and car on ${COMPANY_NAME}.`;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function parsePageParam(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default function PersonalBestsV2() {
  const isPro = useIsProUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parsePageParam(searchParams.get("page"));
  const track = searchParams.get("track")?.trim() ?? "";
  const car = searchParams.get("car")?.trim() ?? "";
  const qFromUrl = searchParams.get("q")?.trim() ?? "";

  const [searchInput, setSearchInput] = useState(qFromUrl);
  const [searchFlushKey, setSearchFlushKey] = useState(0);
  const debouncedQ = useDebouncedValue(
    searchInput,
    SEARCH_DEBOUNCE_MS,
    searchFlushKey,
  );

  useEffect(() => {
    setSearchInput(qFromUrl);
  }, [qFromUrl]);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value == null || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchFlushKey((key) => key + 1);
    updateParams({ q: null, page: "1" });
  }, [updateParams]);

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    setSearchFlushKey((key) => key + 1);
    updateParams({
      q: null,
      track: null,
      car: null,
      page: "1",
    });
  }, [updateParams]);

  useEffect(() => {
    if (debouncedQ === qFromUrl) return;
    updateParams({ q: debouncedQ || null, page: "1" });
  }, [debouncedQ, qFromUrl, updateParams]);

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: qFromUrl || undefined,
      track: track || undefined,
      car: car || undefined,
    }),
    [page, qFromUrl, track, car],
  );

  const { data, isPending, error, isFetching } = useQuery({
    queryKey: ["personal-bests", listParams],
    queryFn: () => getPersonalBests(listParams),
    enabled: isPro,
    placeholderData: keepPreviousData,
    retry: (count, err) =>
      !(err instanceof ApiError && err.status === 403) && count < 1,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["personal-bests", "filter-options"],
    queryFn: getPersonalBestsFilterOptions,
    enabled: isPro,
    staleTime: 60_000,
  });

  const locked =
    !isPro ||
    (error instanceof ApiError && error.status === 403) ||
    isProRequiredError(error);

  const rows = data?.personalBests ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const stats = data?.stats;
  const hasActiveFilters = Boolean(qFromUrl || track || car);
  const isInitialLoad = isPending && data === undefined;
  const showInitialEmpty = !hasActiveFilters && total === 0 && !isInitialLoad;
  const showFilteredEmpty = hasActiveFilters && total === 0 && !isInitialLoad;

  return (
    <>
      <PageMeta
        title={title}
        description={description}
        path={PERSONAL_BESTS_V2_PATH}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-6 px-6 py-8">
        <header>
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Personal bests
          </h1>
          <p className="mt-1.5 max-w-2xl font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            Your fastest qualifying laps by track and car, updated automatically
            from telemetry uploads.
          </p>
        </header>

        {locked ? (
          <PersonalBestsProLockedV2 />
        ) : error && !isProRequiredError(error) ? (
          <div className="rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-6 text-center">
            <p className="font-v2-body text-sm text-v2-error">
              {error instanceof Error
                ? error.message
                : "Could not load personal bests."}
            </p>
          </div>
        ) : showInitialEmpty ? (
          <PersonalBestsEmptyV2 />
        ) : (
          <>
            <PersonalBestsFiltersV2
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              track={track}
              onTrackChange={(value) =>
                updateParams({ track: value || null, page: "1" })
              }
              car={car}
              onCarChange={(value) =>
                updateParams({ car: value || null, page: "1" })
              }
              trackOptions={filterOptions?.tracks ?? []}
              carOptions={filterOptions?.cars ?? []}
              hasActiveFilters={hasActiveFilters}
              onClearSearch={clearSearch}
              onClear={clearAllFilters}
            />

            {isInitialLoad ? (
              <PersonalBestsSkeletonV2 contentOnly />
            ) : (
              <>
                {stats ? <PersonalBestsSummaryV2 stats={stats} /> : null}

                {isFetching ? (
                  <p className="font-v2-body text-xs text-v2-on-surface-variant">
                    Updating…
                  </p>
                ) : null}

                {showFilteredEmpty ? (
                  <div className="rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-8 text-center">
                    <p className="font-v2-body text-sm text-v2-on-surface-variant">
                      No personal bests match your filters.
                    </p>
                  </div>
                ) : (
                  <>
                    <PersonalBestsListV2 rows={rows} />
                    <PersonalBestsPaginationV2
                      page={page}
                      totalPages={totalPages}
                      total={total}
                      limit={PAGE_SIZE}
                      onPageChange={(nextPage) =>
                        updateParams({ page: String(nextPage) })
                      }
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
