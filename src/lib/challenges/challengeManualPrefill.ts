import type { ManualActivityInitialData } from "@/components/ManualActivityForm";

export type ChallengeManualPrefill = {
  sim: string;
  track: string;
  car: string;
};

export function challengeManualPrefillToInitialData(
  prefill: ChallengeManualPrefill,
): ManualActivityInitialData {
  const carToken = prefill.car.trim();
  const trackToken = prefill.track.trim();
  return {
    sim: prefill.sim,
    catalogTrackId: trackToken,
    trackNameHint: trackToken,
    catalogCarId: carToken || null,
    carNameHint: carToken || null,
    manualSessionKind: "PRACTICE",
  };
}

export function challengeDetailToManualPrefill(challenge: {
  sim: string;
  track: string;
  carClass?: string | null;
  vehicle: string;
}): ChallengeManualPrefill {
  return {
    sim: challenge.sim,
    track: challenge.track,
    car: (challenge.carClass?.trim() || challenge.vehicle?.trim()) ?? "",
  };
}
