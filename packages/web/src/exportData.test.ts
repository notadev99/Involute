import { describe, it, expect } from "vitest";
import { toJson, toCsv } from "./exportData.js";
import type { ResultRow } from "./solve.js";

const rows: ResultRow[] = [{
  solution: { train: { stages: [{ driverTeeth: 8, drivenTeeth: 59 }] }, achievedRatio: { n: 59n, d: 8n } as any, errorRel: 0.0003, wheels: 1, totalTeeth: 67 },
  achievedPeriodDays: 29.5, correction: { unitsPerFullError: 32, humanInterval: "about 1 day every ~2.7 years", direction: "fast", beyondConstantPrecision: false }, benchmark: "classic 59-tooth train",
}];

describe("export", () => {
  it("emits JSON with teeth and error", () => {
    const j = JSON.parse(toJson(rows));
    expect(j[0].wheels).toBe(1);
    expect(j[0].teeth).toBe("8:59");
    expect(j[0].errorRel).toBe(0.0003);
  });
  it("emits CSV with a header and a data row", () => {
    const csv = toCsv(rows);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("wheels");
    expect(lines[1]).toContain("8:59");
  });
});
