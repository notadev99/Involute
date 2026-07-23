import { describe, it, expect } from "vitest";
import { renderResultsTable } from "./resultsTable.js";
import type { ResultRow } from "../solve.js";

const rows: ResultRow[] = [
  { solution: { train: { stages: [{ driverTeeth: 8, drivenTeeth: 59 }] }, achievedRatio: { n: 59n, d: 8n } as any, errorRel: 0.0003, wheels: 1, totalTeeth: 67 },
    achievedPeriodDays: 29.5, correction: { unitsPerFullError: 32, humanInterval: "about 1 day every ~2.7 years", direction: "fast", beyondConstantPrecision: false }, benchmark: "classic 59-tooth train" },
  { solution: { train: { stages: [{ driverTeeth: 9, drivenTeeth: 62 }, { driverTeeth: 8, drivenTeeth: 61 }] }, achievedRatio: { n: 1n, d: 1n } as any, errorRel: 0.000001, wheels: 2, totalTeeth: 140 },
    achievedPeriodDays: 29.5306, correction: { unitsPerFullError: 9999, humanInterval: "about 1 day every ~800 years", direction: "slow", beyondConstantPrecision: false }, benchmark: null },
];

describe("results table", () => {
  it("marks the lowest-error row as best and shows benchmark only when present", () => {
    const el = renderResultsTable(rows);
    const best = el.querySelectorAll('[data-best="true"]');
    expect(best.length).toBe(1);
    expect(el.textContent).toContain("classic 59-tooth train");
    expect(el.querySelectorAll("tbody tr").length).toBe(2);
  });
});

describe("empty state", () => {
  it("explains when no train fits the constraints", async () => {
    const { renderResultsTable } = await import("./resultsTable.js");
    const el = renderResultsTable([]);
    expect(el.querySelector(".empty")).not.toBeNull();
    expect(el.textContent).toContain("No train fits these constraints");
  });
});
