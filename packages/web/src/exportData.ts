import type { ResultRow } from "./solve.js";
import { formatTeeth } from "./format.js";
import { summaryText, type SolveSummary } from "./summary.js";

function view(r: ResultRow) {
  return {
    wheels: r.solution.wheels,
    teeth: formatTeeth(r.solution.train),
    ratio: `${r.solution.achievedRatio.n}/${r.solution.achievedRatio.d}`,
    errorRel: r.solution.errorRel,
    totalTeeth: r.solution.totalTeeth,
    achievedPeriodDays: r.achievedPeriodDays,
    correction: r.correction ? r.correction.humanInterval : null,
    // a direction below the constant's precision is not a supported claim
    direction: r.correction && !r.correction.beyondConstantPrecision ? r.correction.direction : null,
    benchmark: r.benchmark,
  };
}

export function toJson(rows: ResultRow[], summary?: SolveSummary): string {
  // With a summary the export carries the full request context, so the file
  // alone reconstructs what was solved.
  if (summary) return JSON.stringify({ target: summary, rows: rows.map(view) }, null, 2);
  return JSON.stringify(rows.map(view), null, 2);
}

export function toCsv(rows: ResultRow[], summary?: SolveSummary): string {
  const cols = ["wheels", "teeth", "ratio", "errorRel", "totalTeeth", "achievedPeriodDays", "correction", "direction", "benchmark"] as const;
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => { const v = view(r) as Record<string, unknown>; return cols.map((c) => esc(v[c])).join(","); });
  const lines = summary ? [`# ${summaryText(summary)}`, head, ...body] : [head, ...body];
  return lines.join("\n");
}
