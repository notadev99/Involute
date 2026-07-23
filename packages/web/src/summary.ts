// Builds the one-line description of what was solved — target, value, source,
// driver convention, constraints — shown between the masthead and the results,
// kept on the printed spec sheet, and embedded in every export so a bench copy
// can be reconstructed without the app.
import { APPROX_PRESETS, EXACT_PRESETS } from "@involute/engine";
import type { ApproxRequest, ExactRequest } from "./solve.js";
import type { PanelState } from "./urlState.js";

export interface SolveSummary {
  target: string;
  value: string;
  unit: string | null;
  source: string | null;
  caveat: string | null;
  driverPeriodDays: string | null;
  displayMultiplicity: number | null;
  gearMin: number;
  gearMax: number;
  maxWheels: number;
}

export function buildSummary(req: ApproxRequest | ExactRequest, state: PanelState): SolveSummary {
  const constraints = {
    gearMin: req.constraints.gearMin,
    gearMax: req.constraints.gearMax,
    maxWheels: req.constraints.maxWheels,
  };
  if (req.kind === "approx") {
    const p = req.presetId ? APPROX_PRESETS.find((x) => x.id === req.presetId) : undefined;
    return {
      target: p ? p.name : "Custom period",
      value: req.periodDays,
      unit: p ? p.unit : "day",
      source: p ? p.source : null,
      caveat: null,
      driverPeriodDays: state.driver,
      displayMultiplicity: req.displayMultiplicity,
      ...constraints,
    };
  }
  const p = req.presetId ? EXACT_PRESETS.find((x) => x.id === req.presetId) : undefined;
  const caveat = [
    p?.note ?? null,
    p?.mechanismDeferred ? `gear side only — ${p.mechanismDeferred}` : null,
  ].filter(Boolean).join("; ") || null;
  const isGoing = state.target === "going-train";
  return {
    target: p ? p.name : isGoing ? "Going train" : "Custom ratio",
    value: isGoing
      ? `${state.bph} bph, ${state.escape} escape teeth (ratio ${req.ratio.n}:${req.ratio.d})`
      : `${req.ratio.n}:${req.ratio.d}`,
    unit: null,
    source: null,
    caveat,
    driverPeriodDays: null,
    displayMultiplicity: null,
    ...constraints,
  };
}

export function summaryText(s: SolveSummary): string {
  const parts = [`${s.target}: ${s.value}${s.unit ? ` ${s.unit}` : ""}`];
  if (s.source) parts.push(`source: ${s.source}`);
  if (s.driverPeriodDays) parts.push(`driver ${s.driverPeriodDays} d`);
  if (s.displayMultiplicity && s.displayMultiplicity !== 1) {
    parts.push(`${s.displayMultiplicity} periods per revolution`);
  }
  parts.push(`gears ${s.gearMin}–${s.gearMax}`, `max ${s.maxWheels} wheels`);
  const line = parts.join(" · ");
  return s.caveat ? `${line} — ${s.caveat}` : line;
}
