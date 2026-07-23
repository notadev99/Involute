export interface Correction {
  unitsPerFullError: number;
  humanInterval: string;
  direction: "fast" | "slow" | "exact";
  beyondConstantPrecision: boolean;
}

export function correction(
  achievedPeriod: number, truePeriod: number, uncertainty: number,
  unitLabel: string, unitDaysApprox: number,
): Correction {
  const errPerUnit = achievedPeriod - truePeriod;        // period error per display cycle
  // uncertainty is absolute, in the preset's unit — compare against the
  // absolute error, not the relative one, or a target known to 1e-6 days
  // would absorb errors ~1e-6 * period instead.
  if (Math.abs(errPerUnit) < uncertainty || errPerUnit === 0) {
    return { unitsPerFullError: Infinity, humanInterval: "beyond the precision of the published value",
             direction: errPerUnit === 0 ? "exact" : (errPerUnit < 0 ? "fast" : "slow"),
             beyondConstantPrecision: Math.abs(errPerUnit) < uncertainty };
  }
  // display drifts one full unit after this many cycles:
  const cyclesPerFullUnit = Math.abs(1 / errPerUnit);
  const days = cyclesPerFullUnit * truePeriod;           // approximate elapsed real time
  const years = days / 365.2422;
  const humanInterval =
    years >= 1 ? `about 1 ${unitLabel} every ${years.toFixed(years < 10 ? 1 : 0)} years`
               : `about 1 ${unitLabel} every ${Math.round(days)} days`;
  return {
    unitsPerFullError: cyclesPerFullUnit,
    humanInterval,
    direction: errPerUnit < 0 ? "fast" : "slow",  // achieved period shorter -> display advances too fast
    beyondConstantPrecision: false,
  };
}
