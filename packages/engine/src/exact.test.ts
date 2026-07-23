import { describe, it, expect } from "vitest";
import { solveExact, goingTrainTarget, MOTION_WORKS } from "./exact.js";
import { DEFAULT_CONSTRAINTS } from "./validate.js";
import { trainRatio, totalTeeth } from "./gear.js";
import { Rational } from "./rational.js";

describe("exact solver", () => {
  it("decomposes motion works 12:1 into in-range stages", () => {
    const sols = solveExact(MOTION_WORKS, { ...DEFAULT_CONSTRAINTS, maxWheels: 2 });
    expect(sols.length).toBeGreaterThan(0);
    for (const s of sols) {
      expect(trainRatio(s.train).equals(Rational.from(12))).toBe(true);
      for (const st of s.train.stages) {
        expect(st.driverTeeth).toBeGreaterThanOrEqual(6);
        expect(st.drivenTeeth).toBeLessThanOrEqual(120);
      }
    }
  });
  it("ranks fewer wheels / fewer teeth first", () => {
    const sols = solveExact(Rational.from(60), { ...DEFAULT_CONSTRAINTS, maxWheels: 3 });
    for (let i = 1; i < sols.length; i++) {
      const a = sols[i - 1], b = sols[i];
      const rank = (x: typeof a) => x.wheels * 10000 + x.totalTeeth;
      expect(rank(a)).toBeLessThanOrEqual(rank(b));
    }
  });
  it("includes the fewest-teeth exact train instead of one greedy factorization", () => {
    // T=12, gears 6..120, maxStageRatio 10. [6->18, 6->24] is exact (3*4=12),
    // clears both stage ratios, and totals 54 teeth. The old solver only tried
    // factorInto's split of P=432 ([6,72] -> ratio 12 > 10) and dropped the whole
    // m=36 candidate, so this minimal train was absent and the #1 result was heavier.
    const c = { ...DEFAULT_CONSTRAINTS, maxWheels: 2 };
    const sols = solveExact(Rational.from(12), c);
    const teeth = sols.map((s) => s.train.stages
      .flatMap((st) => [st.driverTeeth, st.drivenTeeth]).sort((a, b) => a - b).join("x"));
    expect(teeth).toContain("6x6x18x24");
    // fewest-teeth ranks first, so the #1 result is the 54-tooth train
    expect(sols[0].totalTeeth).toBe(54);
    for (const s of sols) expect(trainRatio(s.train).equals(Rational.from(12))).toBe(true);
  });
  it("computes a going-train target from beat rate", () => {
    // 21600 bph, 15-tooth escape -> 21600/(2*15) = 720 escape revs per center-wheel rev
    expect(goingTrainTarget(21600, 15).equals(Rational.from(720))).toBe(true);
  });
  it("solves the 720/1 going-train target without sweeping the whole product range", () => {
    // With the AND break condition the loop kept running until BOTH products
    // exceeded maxProd, sweeping millions of useless multipliers (~13s). The OR
    // break stops as soon as the driven product passes maxProd, so this must
    // finish in milliseconds. A tight timeout fails on the old code, passes now.
    const sols = solveExact(goingTrainTarget(21600, 15), DEFAULT_CONSTRAINTS);
    expect(sols.length).toBeGreaterThan(0);
    for (const s of sols) {
      expect(trainRatio(s.train).equals(Rational.from(720))).toBe(true);
    }
  }, 2000);
});
