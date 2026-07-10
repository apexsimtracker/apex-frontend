import type { LapTimingHighlights } from "@/lib/sessionLapDisplay";
import type { NormalizedLap } from "@/features/session-detail/sessionDetailData";

// NOTE(dummy): Values copied from loveable-ui/public/screens/activity-detail.html
// so every section renders when backend data is missing.

export const DUMMY_TRACK_IMAGE = "/screens/img/oulton-park.svg";

export const DUMMY_LAPS: NormalizedLap[] = [
  {
    lap: 1,
    timeMs: 68861,
    sector1Ms: 19847,
    sector2Ms: 24123,
    sector3Ms: 24891,
  },
  {
    lap: 2,
    timeMs: 68755,
    sector1Ms: 19923,
    sector2Ms: 24089,
    sector3Ms: 24743,
  },
  {
    lap: 3,
    timeMs: 69147,
    sector1Ms: 20012,
    sector2Ms: 24201,
    sector3Ms: 24934,
  },
  {
    lap: 4,
    timeMs: 68871,
    sector1Ms: 19781,
    sector2Ms: 24334,
    sector3Ms: 24756,
  },
  {
    lap: 5,
    timeMs: 68635,
    sector1Ms: 19956,
    sector2Ms: 24067,
    sector3Ms: 24612,
  },
];

export const DUMMY_LAP_HIGHLIGHTS = new Map<number, LapTimingHighlights>([
  [4, { lap: "default", s1: "green", s2: "default", s3: "default" }],
  [5, { lap: "green", s1: "default", s2: "green", s3: "green" }],
]);

export const DUMMY_BEST_LAP_MS = 68635;

export const DUMMY_APEX_TEXT =
  "Your consistency through Raidillon is top-tier. Keep entry speed >240km/h for optimal exit onto Kemmel.";

export const DUMMY_SECTORS_MS = { s1: 19781, s2: 24067, s3: 24612 };
export const DUMMY_IDEAL_LAP_MS = 68460;
