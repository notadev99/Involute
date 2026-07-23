import { describe, it, expect } from "vitest";
import { paretoFrontier, bestTrainForK, coprimeStages } from "./approx.js";
import { DEFAULT_CONSTRAINTS } from "./validate.js";
import { Rational } from "./rational.js";
import { trainRatio, totalTeeth } from "./gear.js";

describe("approx solver", () => {
  it("realises an exactly-representable ratio at k=1", () => {
    const s = bestTrainForK(Rational.from(3), 1, DEFAULT_CONSTRAINTS);
    expect(s).not.toBeNull();
    expect(trainRatio(s!.train).equals(Rational.from(3))).toBe(true);
    expect(s!.errorRel).toBe(0);
  });
  it("frontier error is non-increasing as wheels grow", () => {
    // 12.36827 lunations per tropical year; the frontier beats the classical
    // 235/19 residual from k=2 up (see golden.test.ts for the exact rows)
    const target = Rational.from(1236827n, 100000n);
    const frontier = paretoFrontier(target, { ...DEFAULT_CONSTRAINTS, maxWheels: 3 });
    for (let i = 1; i < frontier.length; i++) {
      expect(frontier[i].errorRel).toBeLessThanOrEqual(frontier[i - 1].errorRel);
    }
    // 235/19 = 12.368421...; expect the best solution to reach at least that accuracy
    const best = frontier[frontier.length - 1];
    expect(best.errorRel).toBeLessThan(1e-4);
  });
  it("returns the fewest-teeth train among equal-error factorizations", () => {
    // target 7/3, k=3, gears 8..21. Driver {8,8,9} gives driven product 1344.
    // The old solver saw only factorInto's [8,8,21] split (62 teeth); the lighter
    // [8,12,14] split (59 teeth) is also exactly 7/3 and must win the tiebreak.
    const c = { ...DEFAULT_CONSTRAINTS, gearMin: 8, gearMax: 21, maxStageRatio: 10 };
    const s = bestTrainForK(Rational.from(7, 3), 3, c);
    expect(s).not.toBeNull();
    expect(trainRatio(s!.train).equals(Rational.from(7, 3))).toBe(true);
    expect(s!.errorRel).toBe(0);
    expect(totalTeeth(s!.train)).toBe(59);
  });
  it("finds the min-error train even when the best driven product is >2 from round(target*Q)", () => {
    // target 29/6, k=3, gears 9..21, maxStageRatio 2. The old +/-2 window around
    // round(target*Q) missed [11,19],[11,20],[13,20] (driven product 7600, three
    // below round(29/6*1573)=7603), which beats the +/-2-window best of 0.00045977.
    const c = { ...DEFAULT_CONSTRAINTS, gearMin: 9, gearMax: 21, maxStageRatio: 2 };
    const s = bestTrainForK(Rational.from(29, 6), 3, c);
    expect(s).not.toBeNull();
    expect(s!.errorRel).toBeLessThanOrEqual(0.000373);
  });
});

describe("hunting-tooth ranking bonus", () => {
  it("counts coprime (driver/driven) stages", () => {
    const train = { stages: [
      { driverTeeth: 6, drivenTeeth: 6 },   // gcd 6 -> not coprime
      { driverTeeth: 6, drivenTeeth: 7 },   // gcd 1 -> coprime
      { driverTeeth: 12, drivenTeeth: 35 }, // gcd 1 -> coprime
    ] };
    expect(coprimeStages(train)).toBe(2);
  });

  it("prefers a coprime train at equal error and never worsens accuracy", () => {
    // Ratio 1, k=2. Min-teeth (bonus off) is 6:6 / 6:6 — zero coprime stages.
    // Bonus on re-pairs to 6:7 / 7:6 (same error 0), giving two coprime stages.
    const off = bestTrainForK(Rational.from(1), 2, DEFAULT_CONSTRAINTS);
    const on = bestTrainForK(Rational.from(1), 2, { ...DEFAULT_CONSTRAINTS, huntingToothBonus: true });
    expect(off).not.toBeNull();
    expect(on).not.toBeNull();
    expect(on!.errorRel).toBe(off!.errorRel);          // bonus does not trade away accuracy
    expect(trainRatio(on!.train).equals(Rational.from(1))).toBe(true);
    expect(coprimeStages(off!.train)).toBe(0);
    expect(coprimeStages(on!.train)).toBe(2);
  });

  it("bonus never reduces coprime count on a realistic target", () => {
    const target = Rational.from(1236827n, 100000n); // lunations per tropical year
    const off = bestTrainForK(target, 3, DEFAULT_CONSTRAINTS)!;
    const on = bestTrainForK(target, 3, { ...DEFAULT_CONSTRAINTS, huntingToothBonus: true })!;
    expect(on.errorRel).toBe(off.errorRel);
    expect(coprimeStages(on.train)).toBeGreaterThanOrEqual(coprimeStages(off.train));
  });
});
