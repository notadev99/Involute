import { renderInputPanel } from "./inputPanel.js";
import { renderResultsTable } from "./resultsTable.js";
import { schematicSvg } from "../schematic.js";
import { toJson, toCsv } from "../exportData.js";
import { solve, type ApproxRequest, type ExactRequest, type ResultRow } from "../solve.js";

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `<header class="masthead"><h1>Involute</h1><p class="tagline">Gear trains for watchmakers, computed exactly</p></header>
    <section class="panel-slot"></section>
    <section class="schematic-slot"></section>
    <section class="results-slot"></section>
    <section class="export-slot"><button data-export="json">Copy JSON</button><button data-export="csv">Download CSV</button></section>`;
  let rows: ResultRow[] = [];
  const resultsSlot = root.querySelector(".results-slot")!;
  const schematicSlot = root.querySelector(".schematic-slot")!;
  const rerender = (req: ApproxRequest | ExactRequest) => {
    rows = solve(req);
    resultsSlot.replaceChildren(renderResultsTable(rows));
    const best = rows.reduce((b, r) => (r.solution.errorRel < b.solution.errorRel ? r : b), rows[0]);
    schematicSlot.innerHTML = best ? schematicSvg(best.solution.train) : "";
  };
  const panel = renderInputPanel(rerender);
  panel.classList.add("input-panel");
  root.querySelector(".panel-slot")!.replaceChildren(panel);
  root.querySelector('[data-export="json"]')!.addEventListener("click", () => navigator.clipboard?.writeText(toJson(rows)));
  root.querySelector('[data-export="csv"]')!.addEventListener("click", () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "involute-frontier.csv"; a.click();
  });
  // initial solve with the panel's default request
  panel.dispatchEvent(new Event("change", { bubbles: true }));
}
