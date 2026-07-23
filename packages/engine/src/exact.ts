import { Rational } from "./rational.js";
import { GearStage, GearTrain, trainRatio, totalTeeth } from "./gear.js";
import { Constraints, Solution } from "./types.js";
import { factorAll } from "./factor.js";

export const MOTION_WORKS = Rational.from(12);

export function goingTrainTarget(bph: number, escapeTeeth: number): Rational {
  return Rational.from(bph, 2 * escapeTeeth);
}

// Exact target n/d realised by a k-stage train: driven-product = n·m, driver-product = d·m
// for some positive multiplier m, each product factoring into k in-range gears.
export function solveExact(target: Rational, c: Constraints, resultCap = 50): Solution[] {
  const out: Solution[] = [];
  const seen = new Set<string>();
  for (let k = 1; k <= c.maxWheels && out.length < resultCap; k++) {
    const maxProd = BigInt(c.gearMax) ** BigInt(k);
    for (let m = 1n; ; m++) {
      const P = target.n * m, Q = target.d * m;
      // Both products grow with m and a k-stage solution needs both <= maxProd,
      // so the instant either one exceeds it no larger m can ever solve: stop here.
      if (P > maxProd || Q > maxProd) break;
      // Enumerate every driven x driver factorization pair rather than one greedy
      // split, so a pairing that trips the stage-ratio cap doesn't discard the
      // other valid factorizations of these products (including the fewest-teeth
      // train). factorAll yields ascending, so positional pairing is the
      // sorted-sorted pairing that minimises the max stage ratio.
      const drivenAll = [...factorAll(P, k, c.gearMin, c.gearMax)];
      if (drivenAll.length === 0) continue;
      const driverAll = [...factorAll(Q, k, c.gearMin, c.gearMax)];
      if (driverAll.length === 0) continue;
      for (const driven of drivenAll) {
        for (const driver of driverAll) {
          const stages: GearStage[] = driver.map((d, i) => ({ driverTeeth: d, drivenTeeth: driven[i] }));
          if (stages.some((s) => s.drivenTeeth / s.driverTeeth > c.maxStageRatio
                              || s.driverTeeth / s.drivenTeeth > c.maxStageRatio)) continue;
          const train: GearTrain = { stages };
          const key = stages.map((s) => `${s.driverTeeth}/${s.drivenTeeth}`).sort().join(",");
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ train, achievedRatio: trainRatio(train), errorRel: 0, wheels: k, totalTeeth: totalTeeth(train) });
        }
      }
      if (out.length >= resultCap) break;
    }
  }
  return out.sort((a, b) => a.wheels - b.wheels || a.totalTeeth - b.totalTeeth);
}
