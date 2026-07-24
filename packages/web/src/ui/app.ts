import { renderInputPanel } from "./inputPanel.js";
import { renderResultsTable } from "./resultsTable.js";
import { schematicSvg } from "../schematic.js";
import { toJson, toCsv } from "../exportData.js";
import { createSolver, type SolveRequest } from "../solveClient.js";
import { encodeState, decodeState, type PanelState } from "../urlState.js";
import { buildSummary, summaryText, type SolveSummary } from "../summary.js";
import { APPROX_PRESETS } from "@involute/engine";
import type { ResultRow } from "../solve.js";

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `<header class="masthead">
      <h1>Involute</h1>
      <p class="tagline">Find the gear tooth counts for a watch complication, and see how accurate each train is.</p>
      <p class="intro">Pick what the train should track — a moon phase, a calendar, world time — and Involute computes the tooth counts and how far each option drifts. <strong>The result below is a live example:</strong> a moon-phase train accurate to about a day in 122 years. Change the target to solve your own.</p>
    </header>
    <section class="panel-slot"></section>
    <p class="solve-summary"></p>
    <p class="solve-status" role="status" hidden>Computing…</p>
    <section class="schematic-slot"></section>
    <p class="schematic-caption" hidden>Gear train for the best row.</p>
    <section class="results-slot"></section>
    <section class="export-slot">
      <button data-export="link">Copy link</button>
      <button data-export="json">Copy JSON</button>
      <button data-export="csv">Download CSV</button>
      <button data-export="print">Print / PDF</button>
    </section>`;
  let rows: ResultRow[] = [];
  let summary: SolveSummary | undefined;
  const resultsSlot = root.querySelector(".results-slot")!;
  const schematicSlot = root.querySelector(".schematic-slot")!;
  const status = root.querySelector<HTMLElement>(".solve-status")!;
  const caption = root.querySelector<HTMLElement>(".schematic-caption")!;
  resultsSlot.setAttribute("aria-live", "polite");
  schematicSlot.setAttribute("tabindex", "0");
  schematicSlot.setAttribute("role", "region");
  schematicSlot.setAttribute("aria-label", "Gear train schematic");
  const runSolve = createSolver();
  const summarySlot = root.querySelector<HTMLElement>(".solve-summary")!;
  const rerender = (req: SolveRequest, state: PanelState) => {
    // the fragment IS the permalink: update it in place, no history spam
    history.replaceState(null, "", "#" + encodeState(state));
    status.hidden = false;
    runSolve(req, (r) => {
      status.hidden = true;
      rows = r;
      summary = buildSummary(req, state);
      summarySlot.textContent = summaryText(summary);
      const preset = req.kind === "approx" && req.presetId
        ? APPROX_PRESETS.find((p) => p.id === req.presetId) : undefined;
      const approxMeta = req.kind === "approx"
        ? { digits: req.precisionDigits, unit: preset ? preset.unit : "day" } : null;
      resultsSlot.replaceChildren(renderResultsTable(rows, approxMeta));
      const best = rows.reduce((b, r) => (r.solution.errorRel < b.solution.errorRel ? r : b), rows[0]);
      schematicSlot.innerHTML = best ? schematicSvg(best.solution.train) : "";
      caption.hidden = !best;
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
  // The URL already carries the full solve (permalink), so a shared link opens a pre-solved view.
  const linkBtn = root.querySelector<HTMLButtonElement>('[data-export="link"]')!;
  linkBtn.addEventListener("click", () => {
    navigator.clipboard?.writeText(location.href);
    const prev = linkBtn.textContent;
    linkBtn.textContent = "Link copied";
    setTimeout(() => { linkBtn.textContent = prev; }, 1500);
  });
  root.querySelector('[data-export="json"]')!.addEventListener("click", () => navigator.clipboard?.writeText(toJson(rows, summary)));
  root.querySelector('[data-export="csv"]')!.addEventListener("click", () => {
    const blob = new Blob([toCsv(rows, summary)], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "involute-frontier.csv"; a.click();
  });
  // The @media print stylesheet already reduces the page to a spec sheet
  // (schematic + table + summary), so opening the browser dialog is all we need.
  root.querySelector('[data-export="print"]')!.addEventListener("click", () => window.print());
  // initial solve with the panel's default request
  panel.dispatchEvent(new Event("change", { bubbles: true }));
}
