import { describe, it, expect } from "vitest";
import { APPROX_PRESETS, EXACT_PRESETS } from "./presets.js";
import { parseDecimal } from "./validate.js";
import { Rational } from "./rational.js";

describe("presets", () => {
  it("every approx preset has a source and parses", () => {
    for (const p of APPROX_PRESETS) {
      expect(p.source.length).toBeGreaterThan(0);
      expect(() => parseDecimal(p.value, p.precisionDigits)).not.toThrow();
    }
  });
  it("Metonic target lunations/year is present and ~12.3683", () => {
    const m = APPROX_PRESETS.find((p) => p.id === "lunations-per-year")!;
    expect(parseDecimal(m.value, m.precisionDigits).toNumber()).toBeCloseTo(12.3683, 3);
  });
  it("motion works exact preset is 12:1", () => {
    const mw = EXACT_PRESETS.find((p) => p.id === "motion-works")!;
    expect(mw.ratio.equals(Rational.from(12))).toBe(true);
  });
});
