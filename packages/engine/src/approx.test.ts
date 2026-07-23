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

describe("exact tie-break ranking", () => {
  // Float error comparisons hand the fewest-teeth tie-break to the wrong train
  // on a few percent of targets; the ranking must go through exact Rationals.
  it("17/14 at k=2 returns the 42-tooth exact train", () => {
    const s = bestTrainForK(Rational.from(17, 14), 2, DEFAULT_CONSTRAINTS)!;
    expect(trainRatio(s.train).equals(Rational.from(17, 14))).toBe(true);
    expect(s.errorRel).toBe(0);
    expect(s.totalTeeth).toBe(42);
  });
  it("397/28 at k=2 returns the 174-tooth train, not a heavier equal-error one", () => {
    const s = bestTrainForK(Rational.from(397, 28), 2, DEFAULT_CONSTRAINTS)!;
    expect(s.totalTeeth).toBe(174);
  });
});

describe("driver-window pruning", () => {
  // Every sorted k-tuple over [min,max], smallest-first (mirrors enumQ's order).
  function tuples(min: number, max: number, k: number): number[][] {
    if (k === 0) return [[]];
    const out: number[][] = [];
    for (let f = min; f <= max; f++) {
      for (const rest of tuples(f, max, k - 1)) out.push([f, ...rest]);
    }
    return out;
  }
  // Unpruned reference: try every driver/driven tuple pair, gate the sorted
  // pairing, rank by the same (errorRel, totalTeeth) rule the solver uses.
  // Error goes through the same Rational path so float artifacts match.
  // Mirrors scan()'s window semantics: a driver product Q only contributes if
  // floor(target*Q) sits in [Pmin-1, Pmax] — the outward walk starts there and
  // stops the moment it is outside the achievable driven-product range, so a Q
  // whose ideal driven product overshoots the range yields nothing at all.
  function bruteBest(target: ReturnType<typeof Rational.from>, k: number, c: typeof DEFAULT_CONSTRAINTS) {
    const PminN = c.gearMin ** k, PmaxN = c.gearMax ** k;
    let best: { errExact: Rational; errorRel: number; totalTeeth: number } | null = null;
    for (const driver of tuples(c.gearMin, c.gearMax, k)) {
      const den = driver.reduce((a, b) => a * BigInt(b), 1n);
      const floorP = Math.floor(target.toNumber() * Number(den));
      const downOpen = floorP >= PminN && floorP <= PmaxN;
      const upOpen = floorP + 1 >= PminN && floorP + 1 <= PmaxN;
      if (!downOpen && !upOpen) continue;
      for (const driven of tuples(c.gearMin, c.gearMax, k)) {
        const gated = driver.every(
          (d, i) => driven[i] / d <= c.maxStageRatio && d / driven[i] <= c.maxStageRatio,
        );
        if (!gated) continue;
        const num = driven.reduce((a, b) => a * BigInt(b), 1n);
        const P = Number(num);
        if (P <= floorP ? !downOpen : !upOpen) continue;
        const achieved = Rational.from(num, den);
        const errExact = achieved.sub(target).abs();
        const errorRel = Math.abs(achieved.sub(target).toNumber() / target.toNumber());
        const teeth = driver.reduce((a, b) => a + b, 0) + driven.reduce((a, b) => a + b, 0);
        const cmp = best === null ? -1 : errExact.cmp(best.errExact);
        if (best === null || cmp < 0 || (cmp === 0 && teeth < best.totalTeeth)) {
          best = { errExact, errorRel, totalTeeth: teeth };
        }
      }
    }
    return best;
  }

  it("agrees with the exhaustive reference on small boxes", () => {
    const c = { ...DEFAULT_CONSTRAINTS, gearMin: 6, gearMax: 14 };
    const targets = [
      Rational.from(59061178n, 1000000n), // double-lunation period multiplier
      Rational.from(1236827n, 100000n),   // lunations per tropical year
      Rational.from(7n, 3n),              // exactly realisable
      Rational.from(97n, 90n),            // near 1, awkward
    ];
    for (const target of targets) {
      for (const k of [1, 2]) {
        const got = bestTrainForK(target, k, c);
        const ref = bruteBest(target, k, c);
        expect(got === null).toBe(ref === null);
        if (got && ref) {
          expect(got.errorRel).toBe(ref.errorRel);
          expect(got.totalTeeth).toBe(ref.totalTeeth);
        }
      }
    }
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

describe("out-of-reach targets", () => {
  // A target outside [gearMin^k/gearMax^k, gearMax^k/gearMin^k] can meet no
  // train at that wheel count: bestTrainForK returns null up front and the
  // frontier comes back empty — the UI's "no train fits" state, not a
  // boundary train with a nonsense error.
  it("returns an empty frontier for a hopeless ratio, quickly", () => {
    const t0 = performance.now();
    expect(paretoFrontier(Rational.from(1000000000n), DEFAULT_CONSTRAINTS)).toEqual([]);
    expect(paretoFrontier(Rational.from(1n, 100000000n), DEFAULT_CONSTRAINTS)).toEqual([]);
    expect(performance.now() - t0).toBeLessThan(100);
  });
  it("omits wheel counts whose band cannot reach the target", () => {
    // moon multiplier 59.06 exceeds the k=1 band (max 120/6 = 20)
    expect(bestTrainForK(Rational.from(59061178n, 1000000n), 1, DEFAULT_CONSTRAINTS)).toBeNull();
  });
});
