import { Rational } from "./rational.js";

export interface GearStage { driverTeeth: number; drivenTeeth: number; isIdler?: boolean; }
export interface GearTrain { stages: GearStage[]; }

export function stageRatio(s: GearStage): Rational {
  if (s.isIdler) return Rational.from(1);
  if (!Number.isInteger(s.driverTeeth) || !Number.isInteger(s.drivenTeeth)
      || s.driverTeeth < 1 || s.drivenTeeth < 1) {
    throw new Error(`stageRatio: tooth counts must be positive integers, got ${s.driverTeeth}/${s.drivenTeeth}`);
  }
  return Rational.from(s.drivenTeeth, s.driverTeeth);
}
export function trainRatio(t: GearTrain): Rational {
  return t.stages.reduce((acc, s) => acc.mul(stageRatio(s)), Rational.from(1));
}
export function totalTeeth(t: GearTrain): number {
  return t.stages.reduce((sum, s) => sum + s.driverTeeth + s.drivenTeeth, 0);
}
export function outputParity(t: GearTrain): 1 | -1 {
  return t.stages.length % 2 === 0 ? 1 : -1;
}
