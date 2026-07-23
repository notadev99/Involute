// Reference database of known/benchmark gear trains, used to label a computed
// train against historical or well-known examples (e.g. "that's the classic
// 59-tooth moon train"). Two rules keep this honest:
//   1. Every entry needs a confirmed primary source before it can be used for
//      matching. Sourceless candidates stay in the list for visibility but are
//      filtered out at runtime, so we never label a train with an unverified
//      claim.
//   2. A label IDENTIFIES the movement — it never carries an accuracy figure.
//      A train's residual is per-train and is computed separately by the
//      report layer; reusing one benchmark's residual across every train that
//      lands nearby would print figures the trains do not have.
export interface ReferenceMovement {
  id: string;
  label: string;
  targetId: string;
  achievedPeriod: number;
  source: string | null;
}

export const REFERENCE_DB: ReferenceMovement[] = [
  // Every entry below is pending primary-source verification and therefore
  // excluded from matching — including the 59-tooth classic: the arrangement
  // is standard, but "standard" is not a citation, and this database holds
  // itself to the same bar CONTRIBUTING sets for everyone else. The first
  // sourced entry turns matching on.
  { id: "classic-59", label: "classic 59-tooth double-moon train",
    targetId: "synodic-month", achievedPeriod: 29.5, source: null },
  { id: "iwc-eternal", label: "IWC Eternal Calendar moon",
    targetId: "synodic-month", achievedPeriod: 29.530589, source: null },
  { id: "patek-precision", label: "Patek precision moon",
    targetId: "synodic-month", achievedPeriod: 29.53125, source: null },
];

// Match on identity, not proximity. A train earns a benchmark's name only when
// it genuinely achieves that benchmark's period; two different trains that both
// land near 29.53 d are not the 59/2 classic and must not borrow its name.
const MATCH_EPS = 1e-9;

export function matchBenchmark(period: number, targetId: string, db: ReferenceMovement[] = REFERENCE_DB): string | null {
  for (const m of db) {
    if (m.targetId !== targetId || m.source === null) continue;
    if (Math.abs(m.achievedPeriod - period) <= MATCH_EPS * Math.max(1, Math.abs(period))) {
      return m.label;
    }
  }
  return null;
}
