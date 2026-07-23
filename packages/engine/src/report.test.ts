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
  it("does not hide errors larger than the absolute uncertainty", () => {
    // 3.1e-4 d absolute error vs 1e-6 d uncertainty: 310x the stated precision,
    // so a finite interval must be quoted (~1 day per ~3200 years), not
    // "within the precision of the modelled constant".
    const c = correction(365.2425, 365.24219, 1e-6, "day", 1);
    expect(c.beyondConstantPrecision).toBe(false);
    expect(Number.isFinite(c.unitsPerFullError)).toBe(true);
    expect(c.unitsPerFullError).toBeGreaterThan(3000);
    expect(c.unitsPerFullError).toBeLessThan(3500);
    expect(c.humanInterval).toMatch(/year/);
  });
});
