import { describe, it, expect } from "vitest";
import { correction } from "./report.js";

describe("correction reporting", () => {
  it("classic 59-tooth moon: ~1 day drift every ~2.7 years, runs fast", () => {
    const c = correction(29.5, 29.530589, 1e-9, "day", 1);
    expect(c.direction).toBe("fast");                 // 29.5 < true -> disc runs fast
    // 1 day / 0.030589 d-per-lunation ~= 32.7 lunations ~= 2.64 years
    expect(c.unitsPerFullError).toBeGreaterThan(30);
    expect(c.unitsPerFullError).toBeLessThan(35);
    expect(c.humanInterval).toMatch(/year/);
  });
  it("caps claims at the constant's precision", () => {
    const c = correction(29.530589, 29.530589, 1e-6, "day", 1);
    expect(c.beyondConstantPrecision).toBe(true);
  });
  it("reports sub-year intervals in days, runs fast", () => {
    // 29.0 vs 29.530589: 1/0.530589 = 1.885 lunations = 55.66 d -> "every 56 days"
    const c = correction(29.0, 29.530589, 1e-9, "day", 1);
    expect(c.direction).toBe("fast");
    expect(c.beyondConstantPrecision).toBe(false);
    expect(c.humanInterval).toBe("about 1 day every 56 days");
  });
  it("reports slow when the achieved period is long", () => {
    const c = correction(29.6, 29.530589, 1e-9, "day", 1);
    expect(c.direction).toBe("slow");
  });
  it("reports exact for equal periods", () => {
    const c = correction(29.530589, 29.530589, 1e-9, "day", 1);
    expect(c.direction).toBe("exact");
    expect(c.unitsPerFullError).toBe(Infinity);
  });
  it("formats years with one decimal under 10 and whole numbers above", () => {
    expect(correction(29.5, 29.530589, 1e-9, "day", 1).humanInterval).toMatch(/every \d\.\d years/);
    expect(correction(29.53, 29.530589, 1e-9, "day", 1).humanInterval).toMatch(/every \d+ years/);
  });
  it("does not hide errors larger than the absolute uncertainty", () => {
    // 3.1e-4 d absolute error vs 1e-6 d uncertainty: 310x the stated precision,
    // so a finite interval must be quoted (~1 day per ~3200 years), not
    // "beyond the precision of the published value".
    const c = correction(365.2425, 365.24219, 1e-6, "day", 1);
    expect(c.beyondConstantPrecision).toBe(false);
    expect(Number.isFinite(c.unitsPerFullError)).toBe(true);
    expect(c.unitsPerFullError).toBeGreaterThan(3000);
    expect(c.unitsPerFullError).toBeLessThan(3500);
    expect(c.humanInterval).toMatch(/year/);
  });
});
