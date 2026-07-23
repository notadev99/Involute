import { describe, it, expect } from "vitest";
import { REFERENCE_DB, matchBenchmark, type ReferenceMovement } from "./reference.js";

// A sourced fixture for exercising the matching logic — the shipped DB holds
// no sourced entry yet (every candidate, the 59-tooth classic included, waits
// on a confirmed citation), so positive-path tests inject their own.
const SOURCED: ReferenceMovement[] = [
  { id: "fixture-59", label: "classic 59-tooth double-moon train",
    targetId: "synodic-month", achievedPeriod: 29.5, source: "test fixture citation" },
];

describe("reference DB", () => {
  it("ships no matchable entry until a primary source is confirmed", () => {
    expect(REFERENCE_DB.every((m) => m.source === null)).toBe(true);
    expect(matchBenchmark(29.5, "synodic-month")).toBeNull();
  });
  it("matches a sourced entry on identity", () => {
    expect(matchBenchmark(29.5, "synodic-month", SOURCED)).toMatch(/59/);
  });
  it("labels are pure identities — no reused accuracy figure", () => {
    for (const m of REFERENCE_DB) expect(m.label).not.toMatch(/\(/);
    expect(matchBenchmark(29.5, "synodic-month", SOURCED)).not.toMatch(/\(/);
  });
  it("matches on identity, not proximity", () => {
    // A near-exact frontier train (29.530589) or a rough one (29.7) lands within
    // 1% of the classic's 29.5 d but is NOT the 59/2 train — must not be labelled.
    expect(matchBenchmark(29.530589, "synodic-month", SOURCED)).toBeNull();
    expect(matchBenchmark(29.7, "synodic-month", SOURCED)).toBeNull();
  });
  it("never matches a sourceless entry even at its exact period", () => {
    const unsourced: ReferenceMovement[] = [{ ...SOURCED[0], source: null }];
    expect(matchBenchmark(29.5, "synodic-month", unsourced)).toBeNull();
  });
});
