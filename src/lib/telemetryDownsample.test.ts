import { describe, expect, it } from "vitest";
import {
  downsampleAlignedTelemetry,
  lttbIndices,
} from "./telemetryDownsample";

describe("lttbIndices", () => {
  it("returns identity when length <= target", () => {
    expect(lttbIndices([0, 1, 2], [0, 10, 0], 10)).toEqual([0, 1, 2]);
  });

  it("always includes first and last", () => {
    const x = Array.from({ length: 100 }, (_, i) => i);
    const y = x.map((i) => Math.sin(i / 5));
    const idx = lttbIndices(x, y, 20);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(99);
    expect(idx.length).toBe(20);
  });
});

describe("downsampleAlignedTelemetry", () => {
  it("keeps channels aligned after downsample", () => {
    const n = 1000;
    const series = {
      distanceM: Array.from({ length: n }, (_, i) => i),
      speedKmh: Array.from({ length: n }, (_, i) => 100 + Math.sin(i / 20) * 40),
      throttlePct: Array.from({ length: n }, (_, i) => (i % 50) * 2),
      brakePct: Array.from({ length: n }, (_, i) => (i % 30 === 0 ? 80 : 0)),
      gear: Array.from({ length: n }, (_, i) => 3 + (i % 4)),
      rpm: Array.from({ length: n }, (_, i) => 5000 + i),
      clutchPct: Array.from({ length: n }, () => 0),
    };

    const out = downsampleAlignedTelemetry(series, 80);
    expect(out.distanceM.length).toBe(80);
    expect(out.speedKmh?.length).toBe(80);
    expect(out.throttlePct?.length).toBe(80);
    expect(out.brakePct?.length).toBe(80);
    expect(out.gear?.length).toBe(80);
    expect(out.rpm?.length).toBe(80);
    expect(out.clutchPct?.length).toBe(80);

    // Shared index semantics: gear[i] still matches original gear at distance index
    for (let i = 0; i < out.distanceM.length; i++) {
      const d = out.distanceM[i]!;
      const origIdx = series.distanceM.indexOf(d);
      expect(out.gear![i]).toBe(series.gear[origIdx]);
      expect(out.rpm![i]).toBe(series.rpm[origIdx]);
    }
  });

  it("returns original when under target (e.g. backend 600-cap)", () => {
    const series = {
      distanceM: [0, 100, 200],
      speedKmh: [100, 120, 110],
      throttlePct: [80, 50, 90],
    };
    expect(downsampleAlignedTelemetry(series, 800)).toBe(series);
  });
});
