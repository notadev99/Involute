import { renderInputPanel } from "./inputPanel.js";
import { renderResultsTable } from "./resultsTable.js";
import { schematicSvg } from "../schematic.js";
import { toJson, toCsv } from "../exportData.js";
import { createSolver, type SolveRequest } from "../solveClient.js";
import { encodeState, decodeState, type PanelState } from "../urlState.js";
import type { ResultRow } from "../solve.js";

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `<header class="masthead"><h1>Involute</h1><p class="tagline">Gear trains for watchmakers, computed exactly</p></header>
    <section class="panel-slot"></section>
    <p class="solve-status" role="status" hidden>Computing…</p>
    <section class="schematic-slot"></section>
    <section class="results-slot"></section>
    <section class="export-slot"><button data-export="json">Copy JSON</button><button data-export="csv">Download CSV</button></section>`;
  let rows: ResultRow[] = [];
  const resultsSlot = root.querySelector(".results-slot")!;
  const schematicSlot = root.querySelector(".schematic-slot")!;
  const status = root.querySelector<HTMLElement>(".solve-status")!;
  const runSolve = createSolver();
  const rerender = (req: SolveRequest, state: PanelState) => {
    // the fragment IS the permalink: update it in place, no history spam
    history.replaceState(null, "", "#" + encodeState(state));
    status.hidden = false;
    runSolve(req, (r) => {
      status.hidden = true;
      rows = r;
      resultsSlot.replaceChildren(renderResultsTable(rows));
      const best = rows.reduce((b, r) => (r.solution.errorRel < b.solution.errorRel ? r : b), rows[0]);
      schematicSlot.innerHTML = best ? schematicSvg(best.solution.train) : "";
    });
  };
  const showError = (message: string) => {
    status.hidden = true;
    const notice = document.createElement("p");
    notice.className = "input-error";
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    resultsSlot.replaceChildren(notice);
    schematicSlot.innerHTML = "";
  };
  // Workers solve off-thread; debouncing keystrokes keeps half-typed values
  // from queueing heavy solves (and error notices from flashing mid-keystroke —
  // both paths share one timer, so the last event wins). The synchronous
  // fallback stays undebounced — it renders in the same tick, which the tests
  // (and no-Worker envs) rely on.
  const dispatch: (fn: () => void) => void =
    typeof Worker === "undefined" ? (fn) => fn() : debounce((fn: () => void) => fn(), 150);
  const panel = renderInputPanel(
    (req, state) => dispatch(() => rerender(req, state)),
    decodeState(location.hash),
    (message) => dispatch(() => showError(message)),
  );
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
