import { describe, it, expect } from "vitest";
import { GearTrain, trainRatio, totalTeeth, outputParity } from "./gear.js";
import { Rational } from "./rational.js";

const t: GearTrain = { stages: [
  { driverTeeth: 12, drivenTeeth: 36 },
  { driverTeeth: 10, drivenTeeth: 40 },
] };

describe("GearTrain", () => {
  it("ratio is the product of driven/driver", () => {
    expect(trainRatio(t).equals(Rational.from(12))).toBe(true); // (36/12)*(40/10)=12
  });
  it("an idler is ratio-neutral but still flips direction", () => {
    const withIdler: GearTrain = { stages: [...t.stages, { driverTeeth: 20, drivenTeeth: 20, isIdler: true }] };
    expect(trainRatio(withIdler).equals(Rational.from(12))).toBe(true);
    expect(outputParity(withIdler)).toBe(-1); // 3 meshes -> odd
  });
  it("counts total teeth", () => { expect(totalTeeth(t)).toBe(98); });
  it("parity flips per mesh", () => { expect(outputParity(t)).toBe(1); }); // 2 meshes -> even
});
