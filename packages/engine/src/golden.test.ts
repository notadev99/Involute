import { describe, it, expect } from "vitest";
import { paretoFrontier } from "./approx.js";
import { solveExact } from "./exact.js";
import { correction } from "./report.js";
import { DEFAULT_CONSTRAINTS } from "./validate.js";
import { Rational } from "./rational.js";
import { trainRatio } from "./gear.js";

describe("golden fixtures", () => {
  it("reproduces the 59-tooth moon correction (1 day / ~2.7 yr, fast)", () => {
    const c = correction(29.5, 29.530589, 1e-6, "day", 1);
    expect(c.direction).toBe("fast");
    expect(c.humanInterval).toMatch(/year/);
  });
  it("reproduces Metonic 235/19 exactly via the exact solver", () => {
    const metonic = Rational.from(235n, 19n);
    const trains = solveExact(metonic, DEFAULT_CONSTRAINTS);
    expect(trains.length).toBeGreaterThan(0);
    expect(trains.some((s) => trainRatio(s.train).equals(metonic))).toBe(true);
  });
  it("frontier for the lunations/year target beats the Metonic residual from k=2 up", () => {
    const target = Rational.from(1236827n, 100000n);
    const frontier = paretoFrontier(target, { ...DEFAULT_CONSTRAINTS, maxWheels: 3 });
    // the exact rows the engine produces — these back the README validation table
    expect(frontier[1].achievedRatio.equals(Rational.from(4601n, 372n))).toBe(true);
    expect(frontier[2].achievedRatio.equals(Rational.from(245572n, 19855n))).toBe(true);
    // 235/19 is NOT on the frontier: the engine finds strictly better trains
    expect(frontier.some((r) => r.achievedRatio.equals(Rational.from(235n, 19n)))).toBe(false);
    // every row from k=2 up beats the classical Metonic approximation's residual
    const metonicResidual = Math.abs(235 / 19 - target.toNumber()) / target.toNumber();
    for (const row of frontier.slice(1)) {
      expect(row.errorRel).toBeLessThan(metonicResidual);
    }
  });
});
