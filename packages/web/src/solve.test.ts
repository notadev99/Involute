import { describe, it, expect } from "vitest";
import { solve } from "./solve.js";
import { DEFAULT_CONSTRAINTS, Rational } from "@involute/engine";

// Reproduces the documented headline example end to end through the real adapter
// path (frontier -> achievedPeriodDays -> correction), not a hardcoded literal.
// Under DEFAULT_CONSTRAINTS the simplest frontier row for the synodic month is
// 6:45 · 8:63 (driver:driven) achieving 945/16 = 29.531250 d per lunation,
// which runs SLOW by about 1 day every 122 years. The 59/2 = 29.5 d "classic
// double-moon" train needs a 1:59 stage, which maxStageRatio=10 forbids, so it
// never appears on the frontier.
describe("solve adapter", () => {
  it("approx moon phase: simplest frontier row is 6:45 · 8:63 = 29.531250 d, slow, ~122 years", () => {
    const rows = solve({
      kind: "approx", presetId: "synodic-month",
      periodDays: "29.530589", precisionDigits: 6, uncertainty: 1e-6,
      driverPeriodDays: Rational.from(1), displayMultiplicity: 2, // 24h driver, double-moon disc
      constraints: { ...DEFAULT_CONSTRAINTS, maxWheels: 3 },
    });
    expect(rows.length).toBeGreaterThan(0);
    const simplest = rows[0];
    expect(simplest.achievedPeriodDays).toBeCloseTo(29.531250, 6);
    // pinions drive wheels: the reduction train must list driver < driven teeth
    expect(simplest.solution.train.stages).toEqual([
      { driverTeeth: 6, drivenTeeth: 45 },
      { driverTeeth: 8, drivenTeeth: 63 },
    ]);
    expect(simplest.solution.achievedRatio.equals(Rational.from(945n, 16n))).toBe(true);
    expect(simplest.correction).not.toBeNull();
    expect(simplest.correction!.direction).toBe("slow");
    expect(simplest.correction!.humanInterval).toBe("about 1 day every 122 years");
    expect(simplest.solution.errorRel).toBeCloseTo(2.238e-5, 8);
    // No frontier row is the genuine 59/2 train, so none may borrow its name.
    expect(rows.every((r) => r.benchmark === null)).toBe(true);
    // more wheels -> not worse error
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].solution.errorRel).toBeLessThanOrEqual(rows[i - 1].solution.errorRel);
    }
  });

  it("solves the default first-load request inside the interaction budget", () => {
    // The exact request inputPanel emits on mount. The budget is a regression
    // canary: window pruning holds this around 0.6 s; anything near the old
    // ~9.5 s synchronous solve must fail loudly.
    const t0 = performance.now();
    solve({
      kind: "approx", presetId: "synodic-month",
      periodDays: "29.530589", precisionDigits: 6, uncertainty: 1e-6,
      driverPeriodDays: Rational.from(1), displayMultiplicity: 2,
      constraints: DEFAULT_CONSTRAINTS,
    });
    expect(performance.now() - t0).toBeLessThan(2500);
  });

  it("exact mode: motion works 12:1 returns exact rows, no correction", () => {
    const rows = solve({ kind: "exact", ratio: Rational.from(12), constraints: { ...DEFAULT_CONSTRAINTS, maxWheels: 2 } });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].solution.errorRel).toBe(0);
    expect(rows[0].correction).toBeNull();
  });
});
