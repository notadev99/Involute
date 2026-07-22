import { Rational } from "./rational.js";
import { GearTrain } from "./gear.js";

export interface Constraints {
  gearMin: number; gearMax: number;
  maxStageRatio: number; maxWheels: number; huntingToothBonus: boolean;
}
export interface IntermediateConstraint { afterStage: number; ratioFromInput: Rational; }
export type TargetSpec =
  | { kind: "exact"; ratio: Rational; intermediates?: IntermediateConstraint[] }
  | { kind: "approx"; value: string; precisionDigits: number; uncertainty: number;
      driverRate: Rational; displayMultiplicity: number; unit: string; source: string };
export interface Solution {
  train: GearTrain; achievedRatio: Rational; errorRel: number; wheels: number; totalTeeth: number;
}
