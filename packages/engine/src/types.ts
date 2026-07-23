import { Rational } from "./rational.js";
import { GearTrain } from "./gear.js";

export interface Constraints {
  gearMin: number; gearMax: number;
  maxStageRatio: number; maxWheels: number; huntingToothBonus: boolean;
  // Optional practicality floor for pinions. The smaller member of a meshing
  // pair is the pinion, and low leaf counts mesh roughly — many makers avoid
  // anything under 8 leaves. When set, every stage's smaller gear must carry
  // at least this many teeth; unset, gearMin is the only floor.
  pinionMin?: number;
}
export interface IntermediateConstraint { afterStage: number; ratioFromInput: Rational; }
export type TargetSpec =
  | { kind: "exact"; ratio: Rational; intermediates?: IntermediateConstraint[] }
  | { kind: "approx"; value: string; precisionDigits: number; uncertainty: number;
      driverRate: Rational; displayMultiplicity: number; unit: string; source: string };
export interface Solution {
  train: GearTrain; achievedRatio: Rational; errorRel: number; wheels: number; totalTeeth: number;
}
