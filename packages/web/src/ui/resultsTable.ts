import type { ResultRow } from "../solve.js";
import { formatError, formatTeeth, formatInterval } from "../format.js";

export function renderResultsTable(
  rows: ResultRow[],
  approxMeta?: { digits: number; unit: string } | null,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "results";
  if (rows.length === 0) { wrap.innerHTML = `<p class="empty">No train fits these constraints. Try more wheels or a wider gear range.</p>`; return wrap; }
  let bestIdx = 0;
  rows.forEach((r, i) => { if (r.solution.errorRel < rows[bestIdx].solution.errorRel) bestIdx = i; });
  const body = rows.map((r, i) => {
    const corr = r.correction
      ? formatInterval(r.correction.humanInterval, r.correction.direction, r.correction.beyondConstantPrecision)
      : "—";
    const bench = r.benchmark ? `<span class="bench">${r.benchmark}</span>` : "";
    // Visible, screen-reader-readable badge — the best row is no longer signalled by colour alone.
    const bestBadge = i === bestIdx ? `<span class="best-badge">best</span> ` : "";
    const period = approxMeta && r.achievedPeriodDays != null
      ? r.achievedPeriodDays.toFixed(approxMeta.digits)
      : "—";
    return `<tr data-best="${i === bestIdx}">
      <td class="num">${bestBadge}${r.solution.wheels}</td>
      <td class="teeth">${formatTeeth(r.solution.train)}</td>
      <td class="num period">${period}</td>
      <td class="num err">${formatError(r.solution.errorRel)}</td>
      <td class="num">${r.solution.totalTeeth}</td>
      <td class="corr">${corr}</td>
      <td class="bench-cell">${bench}</td>
    </tr>`;
  }).join("");
  const periodHead = approxMeta ? `Achieved period (${approxMeta.unit})` : "Achieved period";
  wrap.innerHTML = `<div class="table-scroll" tabindex="0" role="region" aria-label="Candidate gear trains"><table>
    <caption class="visually-hidden">Pareto frontier of candidate gear trains</caption>
    <thead><tr><th scope="col">Wheels</th><th scope="col">Teeth (driver:driven)</th><th scope="col">${periodHead}</th><th scope="col">Error</th><th scope="col">Total teeth</th><th scope="col">Correction</th><th scope="col">Benchmark</th></tr></thead>
    <tbody>${body}</tbody></table></div>
    <p class="results-legend">Each row is one gear train. Fewer wheels are simpler; lower error is more accurate. "Correction" is how often you would nudge the hand to keep it right.</p>`;
  return wrap;
}
