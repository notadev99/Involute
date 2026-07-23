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

describe("representative-preset honesty markers", () => {
  const representative = ["jump-hour", "retrograde-drive", "wandering-hours", "power-reserve"];
  it.each(representative)("%s is marked deferred and representative", (id) => {
    const p = EXACT_PRESETS.find((x) => x.id === id)!;
    expect(p.mechanismDeferred).toBeTruthy();
    expect(p.note).toMatch(/representative|placeholder|digital/);
  });
  it("no sourced preset borrows the representative markers", () => {
    for (const p of EXACT_PRESETS) {
      if (representative.includes(p.id)) continue;
      expect(p.mechanismDeferred).toBeUndefined();
      expect(p.note ?? "").not.toMatch(/representative|placeholder/);
    }
  });
});
