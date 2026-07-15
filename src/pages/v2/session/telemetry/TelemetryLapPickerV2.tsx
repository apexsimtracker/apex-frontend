import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatLapMs, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  v2DropdownContentClassName,
  v2DropdownItemClassName,
  v2ManualSelectClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import type { TelemetryLapSummary } from "@/features/telemetry-analysis/types";

type TelemetryLapPickerV2Props = {
  laps: TelemetryLapSummary[];
  selectedLap: number | null;
  compareLap: number | null;
  onSelectLap: (lapNumber: number) => void;
  onSelectCompare: (lapNumber: number | null) => void;
};

export default function TelemetryLapPickerV2({
  laps,
  selectedLap,
  compareLap,
  onSelectLap,
  onSelectCompare,
}: TelemetryLapPickerV2Props) {
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const ordered = useMemo(
    () => [...laps].sort((a, b) => a.lapNumber - b.lapNumber),
    [laps],
  );
  const selected = ordered.find((l) => l.lapNumber === selectedLap) ?? null;
  const selectedIdx = ordered.findIndex((l) => l.lapNumber === selectedLap);

  const compareOptions = ordered.filter(
    (l) => l.lapNumber !== selectedLap && l.hasTraces,
  );

  function goPrev() {
    if (selectedIdx <= 0) return;
    onSelectLap(ordered[selectedIdx - 1]!.lapNumber);
  }

  function goNext() {
    if (selectedIdx < 0 || selectedIdx >= ordered.length - 1) return;
    onSelectLap(ordered[selectedIdx + 1]!.lapNumber);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={selectedIdx <= 0}
          className="flex size-10 shrink-0 items-center justify-center rounded-[0.5rem] border border-v2-outline-variant/40 bg-v2-surface-container text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous lap"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <DropdownMenu open={primaryOpen} onOpenChange={setPrimaryOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                v2ManualSelectClassName,
                "flex min-w-0 flex-1 items-center justify-between text-left",
              )}
              data-testid="telemetry-lap-picker"
            >
              <span className="truncate">
                {selected
                  ? `Lap ${selected.lapNumber} · ${formatLapMs(selected.lapTimeMs)}${
                      selected.isBestLap ? " · Best" : ""
                    }${selected.isOutLap ? " · Out" : ""}`
                  : "Select lap"}
              </span>
              <ChevronDown
                className={cn(
                  "ml-2 size-4 shrink-0 text-v2-on-surface-variant transition-transform duration-200",
                  primaryOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className={cn(v2DropdownContentClassName, "max-h-72 w-[min(100vw-2rem,20rem)] overflow-y-auto")}
          >
            <DropdownMenuRadioGroup
              value={selectedLap != null ? String(selectedLap) : ""}
              onValueChange={(v) => {
                const n = Number(v);
                if (Number.isFinite(n)) onSelectLap(n);
              }}
            >
              {ordered.map((lap) => (
                <DropdownMenuRadioItem
                  key={lap.lapNumber}
                  value={String(lap.lapNumber)}
                  className={v2DropdownItemClassName}
                  data-testid={`telemetry-lap-${lap.lapNumber}`}
                >
                  Lap {lap.lapNumber} · {formatLapMs(lap.lapTimeMs)}
                  {lap.isBestLap ? " · Best" : ""}
                  {lap.isOutLap ? " · Out" : ""}
                  {!lap.hasTraces ? " · No trace" : ""}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={goNext}
          disabled={selectedIdx < 0 || selectedIdx >= ordered.length - 1}
          className="flex size-10 shrink-0 items-center justify-center rounded-[0.5rem] border border-v2-outline-variant/40 bg-v2-surface-container text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next lap"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="w-full sm:w-56">
        <p className="mb-1 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
          Compare lap
        </p>
        <DropdownMenu open={compareOpen} onOpenChange={setCompareOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                v2ManualSelectClassName,
                "flex w-full items-center justify-between text-left",
              )}
            >
              <span className="truncate">
                {compareLap != null ? `Lap ${compareLap}` : "None"}
              </span>
              <ChevronDown
                className={cn(
                  "ml-2 size-4 shrink-0 text-v2-on-surface-variant transition-transform duration-200",
                  compareOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(v2DropdownContentClassName, "max-h-72 w-56 overflow-y-auto")}
          >
            <DropdownMenuRadioGroup
              value={compareLap != null ? String(compareLap) : "__none__"}
              onValueChange={(v) => {
                if (!v || v === "__none__") {
                  onSelectCompare(null);
                  return;
                }
                const n = Number(v);
                if (Number.isFinite(n)) onSelectCompare(n);
              }}
            >
              <DropdownMenuRadioItem
                value="__none__"
                className={v2DropdownItemClassName}
              >
                None
              </DropdownMenuRadioItem>
              {compareOptions.map((lap) => (
                <DropdownMenuRadioItem
                  key={lap.lapNumber}
                  value={String(lap.lapNumber)}
                  className={v2DropdownItemClassName}
                >
                  Lap {lap.lapNumber} ({formatLapMs(lap.lapTimeMs)})
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
