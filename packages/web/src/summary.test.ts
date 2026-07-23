import { describe, it, expect } from "vitest";
import { buildSummary, summaryText } from "./summary.js";
import { DEFAULT_CONSTRAINTS, Rational } from "@involute/engine";
import type { PanelState } from "./urlState.js";

const state: PanelState = {
  target: "approx:synodic-month", driver: "1", mult: "2",
  wheels: "4", gearMin: "6", gearMax: "120",
};

describe("solve summary", () => {
  it("captures an approx preset's provenance and constraints", () => {
    const s = buildSummary({
      kind: "approx", presetId: "synodic-month", periodDays: "29.530589",
      precisionDigits: 6, uncertainty: 1e-6, driverPeriodDays: Rational.from(1),
      displayMultiplicity: 2, constraints: DEFAULT_CONSTRAINTS,
    }, state);
    expect(s.target).toBe("Synodic month (moon phase)");
    expect(s.source).toBe("Meeus, Astronomical Algorithms");
    const line = summaryText(s);
    expect(line).toContain("29.530589 day");
    expect(line).toContain("source: Meeus");
    expect(line).toContain("2 periods per revolution");
    expect(line).toContain("gears 6–120");
  });

  it("carries an exact preset's deferred-mechanism caveat", () => {
    const s = buildSummary({
      kind: "exact", presetId: "date-31", ratio: Rational.from(31),
      constraints: DEFAULT_CONSTRAINTS,
    }, { ...state, target: "exact:date-31" });
    expect(s.value).toBe("31:1");
    expect(s.caveat).toContain("stepping");
  });

  it("describes a going-train request by beat rate", () => {
    const s = buildSummary({
      kind: "exact", ratio: Rational.from(600),
      constraints: DEFAULT_CONSTRAINTS,
    }, { ...state, target: "going-train", bph: "18000", escape: "15" });
    expect(s.target).toBe("Going train");
    expect(s.value).toContain("18000 bph");
  });
});
