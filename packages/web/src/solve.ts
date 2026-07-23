import {
  paretoFrontier, solveExact, correction, matchBenchmark, parseDecimal, Rational,
  type Constraints, type Solution,
} from "@involute/engine";

export interface ApproxRequest {
  kind: "approx"; presetId?: string;
  periodDays: string; precisionDigits: number; uncertainty: number;
  driverPeriodDays: Rational; displayMultiplicity: number; constraints: Constraints;
}
export interface ExactRequest { kind: "exact"; presetId?: string; ratio: Rational; constraints: Constraints; }
export interface ResultRow {
  solution: Solution;
  achievedPeriodDays: number | null;
  correction: ReturnType<typeof correction> | null;
  benchmark: string | null;
}

export function solve(req: ApproxRequest | ExactRequest): ResultRow[] {
  if (req.kind === "exact") {
    return solveExact(req.ratio, req.constraints).map((solution) => ({
      solution, achievedPeriodDays: null, correction: null, benchmark: null,
    }));
  }
  const truePeriod = parseDecimal(req.periodDays, req.precisionDigits);
  // target ratio = (multiplicity * truePeriod) / driverPeriodDays — the train's
  // period multiplier, matching the engine's trainRatio convention
  // (driven-tooth products over driver-tooth products; a reduction slows the output)
  const denom = truePeriod.mul(Rational.from(req.displayMultiplicity));
  const target = denom.div(req.driverPeriodDays);
  const truePeriodNum = truePeriod.toNumber();
  const driverNum = req.driverPeriodDays.toNumber();
  return paretoFrontier(target, req.constraints).map((solution) => {
    const achievedPeriodDays = (driverNum * solution.achievedRatio.toNumber()) / req.displayMultiplicity;
    const corr = correction(achievedPeriodDays, truePeriodNum, req.uncertainty, "day", 1);
    const benchmark = req.presetId ? matchBenchmark(achievedPeriodDays, req.presetId) : null;
    return { solution, achievedPeriodDays, correction: corr, benchmark };
  });
}
