import { describe, expect, it } from "vitest";
import { clipIsolatedPedalIslands, clipPedalChannels } from "./telemetrySpikeClip";

describe("clipIsolatedPedalIslands", () => {
  it("drops a 1-sample 0→100→0 island", () => {
    expect(clipIsolatedPedalIslands([0, 0, 100, 0, 0])).toEqual([0, 0, 0, 0, 0]);
  });

  it("keeps a sustained three-sample WOT peak", () => {
    expect(clipIsolatedPedalIslands([0, 100, 100, 100, 0])).toEqual([
      0, 100, 100, 100, 0,
    ]);
  });

  it("does not invent 33/66 geometric splits", () => {
    const clipped = clipIsolatedPedalIslands([0, 33, 66, 100]);
    expect(clipped).toEqual([0, 33, 66, 100]);
    expect(clipped).not.toContain(0.333);
    expect(clipped).not.toContain(0.666);
  });

  it("leaves gear-like short series unchanged", () => {
    expect(clipIsolatedPedalIslands([3, 4])).toEqual([3, 4]);
  });
});

describe("clipPedalChannels", () => {
  it("clips throttle and brake without mutating gear", () => {
    const series = {
      distanceM: [0, 1, 2, 3, 4],
      throttlePct: [0, 0, 100, 0, 0],
      brakePct: [0, 0, 0, 0, 0],
      gear: [2, 3, 4, 5, 6],
    };
    const out = clipPedalChannels(series);
    expect(out.throttlePct).toEqual([0, 0, 0, 0, 0]);
    expect(out.gear).toEqual([2, 3, 4, 5, 6]);
    expect(series.throttlePct[2]).toBe(100);
  });
});
