import {
  APPROX_PRESETS, EXACT_PRESETS, DEFAULT_CONSTRAINTS, parseDecimal,
  validateApproxTarget, validateConstraints, goingTrainTarget, Rational,
  type Constraints,
} from "@involute/engine";
import type { ApproxRequest, ExactRequest } from "../solve.js";
import type { PanelState } from "../urlState.js";

const DEFAULT_PRESET_ID = "synodic-month";
// Fixed precision used only for parsing the driver-period and custom-target
// text fields into Rationals; unrelated to a preset's own precisionDigits.
const FIELD_PRECISION_DIGITS = 6;

export function renderInputPanel(
  onChange: (req: ApproxRequest | ExactRequest, state: PanelState) => void,
  initial?: Partial<PanelState>,
  onError?: (message: string) => void,
): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="field target-field">
      <label for="preset-select">Target</label>
      <select id="preset-select">
        <optgroup label="Astronomical (approximate)">
          ${APPROX_PRESETS.map((p) => `<option value="approx:${p.id}">${p.name}</option>`).join("")}
        </optgroup>
        <optgroup label="Mechanical (exact)">
          ${EXACT_PRESETS.map((p) => `<option value="exact:${p.id}">${p.name}</option>`).join("")}
        </optgroup>
        <option value="custom">Custom period (approximate)…</option>
        <option value="custom-ratio">Custom ratio (exact)…</option>
        <option value="going-train">Going train (beat rate)…</option>
      </select>
      <p class="target-note" hidden></p>
    </div>
    <div class="field custom-target" hidden>
      <label for="custom-period">Period (days)</label>
      <input id="custom-period" type="text" value="29.530589" />
      <label for="custom-precision">Precision (digits)</label>
      <input id="custom-precision" type="number" min="1" max="15" value="${FIELD_PRECISION_DIGITS}" />
    </div>
    <div class="field custom-ratio-field" hidden>
      <label for="ratio-num">Target ratio</label>
      <input id="ratio-num" type="number" min="1" step="1" value="12" />
      <span class="range-sep">:</span>
      <input id="ratio-den" type="number" min="1" step="1" value="1" aria-label="Target ratio denominator" />
    </div>
    <div class="field going-train-field" hidden>
      <label for="beat-rate">Beat rate (bph)</label>
      <input id="beat-rate" list="bph-rates" inputmode="numeric" value="18000" />
      <datalist id="bph-rates">
        <option value="18000"></option><option value="21600"></option><option value="25200"></option>
        <option value="28800"></option><option value="36000"></option>
      </datalist>
      <label for="escape-teeth">Escape-wheel teeth</label>
      <input id="escape-teeth" type="number" min="1" step="1" value="15" />
    </div>
    <div class="field">
      <label for="driver-period">Driver period (days)</label>
      <input id="driver-period" type="text" value="1" />
    </div>
    <div class="field">
      <label for="multiplicity">Periods per display revolution</label>
      <input id="multiplicity" type="number" min="1" value="2" />
      <span class="hint">2 = double-moon disc</span>
    </div>
    <div class="field">
      <label for="max-wheels">Max wheels</label>
      <input id="max-wheels" type="number" min="1" value="${DEFAULT_CONSTRAINTS.maxWheels}" />
    </div>
    <div class="field gear-range">
      <label for="gear-min">Gear range</label>
      <input id="gear-min" type="number" min="6" value="${DEFAULT_CONSTRAINTS.gearMin}" />
      <span class="range-sep">–</span>
      <input id="gear-max" type="number" min="6" value="${DEFAULT_CONSTRAINTS.gearMax}" aria-label="Gear range maximum" />
    </div>
    <div class="field">
      <label for="pinion-min">Pinion leaf minimum</label>
      <input id="pinion-min" type="number" min="6" placeholder="off" />
      <span class="hint">floor for each stage's smaller gear</span>
    </div>
  `;

  const presetSelect = root.querySelector<HTMLSelectElement>("#preset-select")!;
  const customField = root.querySelector<HTMLElement>(".custom-target")!;
  const customPeriod = root.querySelector<HTMLInputElement>("#custom-period")!;
  const customPrecision = root.querySelector<HTMLInputElement>("#custom-precision")!;
  const ratioField = root.querySelector<HTMLElement>(".custom-ratio-field")!;
  const ratioNum = root.querySelector<HTMLInputElement>("#ratio-num")!;
  const ratioDen = root.querySelector<HTMLInputElement>("#ratio-den")!;
  const goingField = root.querySelector<HTMLElement>(".going-train-field")!;
  const beatRate = root.querySelector<HTMLInputElement>("#beat-rate")!;
  const escapeTeeth = root.querySelector<HTMLInputElement>("#escape-teeth")!;
  const driverPeriod = root.querySelector<HTMLInputElement>("#driver-period")!;
  const multiplicity = root.querySelector<HTMLInputElement>("#multiplicity")!;
  const maxWheels = root.querySelector<HTMLInputElement>("#max-wheels")!;
  const gearMin = root.querySelector<HTMLInputElement>("#gear-min")!;
  const gearMax = root.querySelector<HTMLInputElement>("#gear-max")!;
  const pinionMin = root.querySelector<HTMLInputElement>("#pinion-min")!;

  presetSelect.value = `approx:${DEFAULT_PRESET_ID}`;

  // Restore a shared-link state: apply only values the URL layer already
  // shape-checked, and only a target that exists in this build's preset list.
  if (initial) {
    if (initial.target && [...presetSelect.options].some((o) => o.value === initial.target)) {
      presetSelect.value = initial.target;
      customField.hidden = initial.target !== "custom";
    }
    if (initial.period) customPeriod.value = initial.period;
    if (initial.precision) customPrecision.value = initial.precision;
    if (initial.driver) driverPeriod.value = initial.driver;
    if (initial.mult) {
      multiplicity.value = initial.mult;
    } else if (initial.target?.startsWith("approx:")) {
      // a link that names a preset but no multiplicity gets that preset's default
      const preset = APPROX_PRESETS.find((p) => `approx:${p.id}` === initial.target);
      if (preset) multiplicity.value = String(preset.defaultMultiplicity);
    }
    if (initial.wheels) maxWheels.value = initial.wheels;
    if (initial.gearMin) gearMin.value = initial.gearMin;
    if (initial.gearMax) gearMax.value = initial.gearMax;
    if (initial.pinionMin) pinionMin.value = initial.pinionMin;
    if (initial.num) ratioNum.value = initial.num;
    if (initial.den) ratioDen.value = initial.den;
    if (initial.bph) beatRate.value = initial.bph;
    if (initial.escape) escapeTeeth.value = initial.escape;
  }

  function buildConstraints(): Constraints {
    const pm = Number(pinionMin.value);
    const c = {
      ...DEFAULT_CONSTRAINTS,
      gearMin: Number(gearMin.value) || DEFAULT_CONSTRAINTS.gearMin,
      gearMax: Number(gearMax.value) || DEFAULT_CONSTRAINTS.gearMax,
      maxWheels: Number(maxWheels.value) || DEFAULT_CONSTRAINTS.maxWheels,
      ...(pm ? { pinionMin: pm } : {}),
    };
    try {
      validateConstraints(c);
    } catch {
      throw new Error("Check the gear range: at least 6 teeth, maximum no smaller than minimum, pinion floor inside the range, at least 1 wheel.");
    }
    return c;
  }

  function friendlyParse(raw: string, label: string, example: string): Rational {
    try {
      return parseDecimal(raw, FIELD_PRECISION_DIGITS);
    } catch {
      throw new Error(`Could not read ${label} "${raw}" — use a decimal point, e.g. ${example}`);
    }
  }

  // Track the chosen target so switching presets can seed the multiplicity
  // field with that preset's display convention without clobbering later edits
  // (or a value restored from a shared link — hence starting at the current value).
  let lastTarget = presetSelect.value;

  function fieldState(selected: string): PanelState {
    const state: PanelState = {
      target: selected,
      driver: driverPeriod.value.trim() || "1",
      mult: multiplicity.value || "1",
      wheels: maxWheels.value,
      gearMin: gearMin.value,
      gearMax: gearMax.value,
      ...(pinionMin.value ? { pinionMin: pinionMin.value } : {}),
    };
    if (selected === "custom") {
      state.period = customPeriod.value.trim();
      state.precision = customPrecision.value;
    }
    if (selected === "custom-ratio") {
      state.num = ratioNum.value;
      state.den = ratioDen.value;
    }
    if (selected === "going-train") {
      state.bph = beatRate.value.trim();
      state.escape = escapeTeeth.value;
    }
    return state;
  }

  function parsePositiveInt(raw: string, label: string): number {
    if (!/^\d+$/.test(raw) || Number(raw) < 1) {
      throw new Error(`${label} must be a whole number of 1 or more (got "${raw}").`);
    }
    return Number(raw);
  }

  // The provenance line under the target select: an approx preset shows its
  // source and driver convention; an exact preset shows its note, plus a
  // deferred-mechanism tag or a representative-value disclaimer where honesty
  // requires one. The app's README promises these caveats are marked.
  const targetNote = root.querySelector<HTMLElement>(".target-note")!;
  function renderTargetNote(selected: string): void {
    let text = "";
    if (selected.startsWith("approx:")) {
      const p = APPROX_PRESETS.find((x) => `approx:${x.id}` === selected);
      if (p) text = `Source: ${p.source} — ${p.driverNote}`;
    } else if (selected.startsWith("exact:")) {
      const p = EXACT_PRESETS.find((x) => `exact:${x.id}` === selected);
      if (p) {
        const bits: string[] = [];
        if (p.note) bits.push(p.note);
        if (p.mechanismDeferred) bits.push(`gear side only — ${p.mechanismDeferred}`);
        if (p.note && /representative|placeholder/.test(p.note)) {
          bits.push("representative value, not a sourced specification");
        }
        text = bits.join("; ");
      }
    }
    targetNote.textContent = text;
    targetNote.hidden = text === "";
  }

  function emit(): void {
    const selected = presetSelect.value;
    customField.hidden = selected !== "custom";
    ratioField.hidden = selected !== "custom-ratio";
    goingField.hidden = selected !== "going-train";
    renderTargetNote(selected);
    if (selected !== lastTarget) {
      lastTarget = selected;
      if (selected.startsWith("approx:")) {
        const preset = APPROX_PRESETS.find((p) => `approx:${p.id}` === selected);
        if (preset) multiplicity.value = String(preset.defaultMultiplicity);
      }
    }

    try {
      const state = fieldState(selected);
      const constraints = buildConstraints();
      const driverPeriodDays = friendlyParse(driverPeriod.value.trim() || "1", "driver period", "1 or 0.5");
      const displayMultiplicity = Number(multiplicity.value) || 1;

      if (selected.startsWith("exact:")) {
        const id = selected.slice("exact:".length);
        const preset = EXACT_PRESETS.find((p) => p.id === id);
        if (!preset) return;
        const req: ExactRequest = { kind: "exact", presetId: preset.id, ratio: preset.ratio, constraints };
        onChange(req, state);
        return;
      }

      if (selected === "custom-ratio") {
        const num = parsePositiveInt(ratioNum.value, "Ratio numerator");
        const den = parsePositiveInt(ratioDen.value, "Ratio denominator");
        const req: ExactRequest = { kind: "exact", ratio: Rational.from(num, den), constraints };
        onChange(req, state);
        return;
      }

      if (selected === "going-train") {
        const bph = parsePositiveInt(beatRate.value.trim(), "Beat rate");
        const teeth = parsePositiveInt(escapeTeeth.value, "Escape-wheel teeth");
        const req: ExactRequest = { kind: "exact", ratio: goingTrainTarget(bph, teeth), constraints };
        onChange(req, state);
        return;
      }

      if (selected === "custom") {
        const periodDays = customPeriod.value.trim();
        const precisionDigits = Number(customPrecision.value) || FIELD_PRECISION_DIGITS;
        friendlyParse(periodDays, "period", "29.530589"); // format check with a helpful message
        try {
          validateApproxTarget({ value: periodDays, precisionDigits });
        } catch {
          throw new Error("Period must be a positive number of days.");
        }
        const req: ApproxRequest = {
          kind: "approx", periodDays, precisionDigits, uncertainty: 10 ** -precisionDigits,
          driverPeriodDays, displayMultiplicity, constraints,
        };
        onChange(req, state);
        return;
      }

      // approx preset
      const id = selected.slice("approx:".length);
      const preset = APPROX_PRESETS.find((p) => p.id === id);
      if (!preset) return;
      const req: ApproxRequest = {
        kind: "approx", presetId: preset.id, periodDays: preset.value, precisionDigits: preset.precisionDigits,
        uncertainty: preset.uncertainty, driverPeriodDays, displayMultiplicity, constraints,
      };
      onChange(req, state);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : String(err));
    }
  }

  root.addEventListener("input", emit);
  root.addEventListener("change", emit);
  return root;
}
