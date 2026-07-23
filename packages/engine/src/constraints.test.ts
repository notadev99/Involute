import { describe, it, expect } from "vitest";
import { bestTrainForK } from "./approx.js";
import { solveExact } from "./exact.js";
import { validateConstraints, DEFAULT_CONSTRAINTS } from "./validate.js";
import { Rational } from "./rational.js";

// The pinion is the smaller member of a meshing pair. Leaf counts below ~8
// mesh roughly enough that many makers avoid them; pinionMin lets a user
// demand a floor for pinions without raising gearMin for everything.
describe("pinion leaf minimum", () => {
  it("keeps every stage's smaller member at or above pinionMin (approx)", () => {
    const c = { ...DEFAULT_CONSTRAINTS, pinionMin: 8 };
    const s = bestTrainForK(Rational.from(59061178n, 1000000n), 2, c);
    expect(s).not.toBeNull();
    for (const st of s!.train.stages) {
      expect(Math.min(st.driverTeeth, st.drivenTeeth)).toBeGreaterThanOrEqual(8);
    }
  });
  it("changes the default moon train, which uses a 6-leaf pinion", () => {
    const free = bestTrainForK(Rational.from(59061178n, 1000000n), 2, DEFAULT_CONSTRAINTS)!;
    expect(free.train.stages[0].driverTeeth).toBe(6); // the 6:45 · 8:63 baseline
    const constrained = bestTrainForK(Rational.from(59061178n, 1000000n), 2, { ...DEFAULT_CONSTRAINTS, pinionMin: 8 })!;
    expect(constrained.train.stages.every((st) => Math.min(st.driverTeeth, st.drivenTeeth) >= 8)).toBe(true);
  });
  it("applies to the exact solver too", () => {
    const trains = solveExact(Rational.from(12), { ...DEFAULT_CONSTRAINTS, pinionMin: 10 });
    expect(trains.length).toBeGreaterThan(0);
    for (const s of trains) {
      for (const st of s.train.stages) {
        expect(Math.min(st.driverTeeth, st.drivenTeeth)).toBeGreaterThanOrEqual(10);
      }
    }
  });
  it("leaves results untouched when unset", () => {
    const s = bestTrainForK(Rational.from(59061178n, 1000000n), 2, DEFAULT_CONSTRAINTS)!;
    expect(s.achievedRatio.equals(Rational.from(945n, 16n))).toBe(true);
  });
  it("rejects a pinionMin outside the gear range", () => {
    expect(() => validateConstraints({ ...DEFAULT_CONSTRAINTS, pinionMin: 5 })).toThrow(/pinionMin/);
    expect(() => validateConstraints({ ...DEFAULT_CONSTRAINTS, pinionMin: 121 })).toThrow(/pinionMin/);
  });
});
