import type { ResultRow } from "../solve.js";
import { formatError, formatTeeth, formatInterval } from "../format.js";

export function renderResultsTable(rows: ResultRow[]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "results";
  if (rows.length === 0) { wrap.innerHTML = `<p class="empty">No train fits these constraints. Try more wheels or a wider gear range.</p>`; return wrap; }
  let bestIdx = 0;
  rows.forEach((r, i) => { if (r.solution.errorRel < rows[bestIdx].solution.errorRel) bestIdx = i; });
  const body = rows.map((r, i) => {
    const corr = r.correction ? formatInterval(r.correction.humanInterval, r.correction.direction) : "—";
    const bench = r.benchmark ? `<span class="bench">${r.benchmark}</span>` : "";
    return `<tr data-best="${i === bestIdx}">
      <td class="num">${r.solution.wheels}</td>
      <td class="teeth">${formatTeeth(r.solution.train)}</td>
      <td class="num err">${formatError(r.solution.errorRel)}</td>
      <td class="num">${r.solution.totalTeeth}</td>
      <td class="corr">${corr}</td>
      <td class="bench-cell">${bench}</td>
    </tr>`;
  }).join("");
  wrap.innerHTML = `<div class="table-scroll"><table>
    <thead><tr><th>Wheels</th><th>Teeth (driver:driven)</th><th>Error</th><th>Total teeth</th><th>Correction</th><th>Benchmark</th></tr></thead>
    <tbody>${body}</tbody></table></div>`;
  return wrap;
}
