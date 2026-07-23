import {
  APPROX_PRESETS, EXACT_PRESETS, DEFAULT_CONSTRAINTS, parseDecimal,
  validateApproxTarget, validateConstraints,
  type Constraints, type Rational,
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
        <option value="custom">Custom target…</option>
      </select>
    </div>
    <div class="field custom-target" hidden>
      <label for="custom-period">Period (days)</label>
      <input id="custom-period" type="text" value="29.530589" />
      <label for="custom-precision">Precision (digits)</label>
      <input id="custom-precision" type="number" min="1" max="15" value="${FIELD_PRECISION_DIGITS}" />
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
  `;

  const presetSelect = root.querySelector<HTMLSelectElement>("#preset-select")!;
  const customField = root.querySelector<HTMLElement>(".custom-target")!;
  const customPeriod = root.querySelector<HTMLInputElement>("#custom-period")!;
  const customPrecision = root.querySelector<HTMLInputElement>("#custom-precision")!;
  const driverPeriod = root.querySelector<HTMLInputElement>("#driver-period")!;
  const multiplicity = root.querySelector<HTMLInputElement>("#multiplicity")!;
  const maxWheels = root.querySelector<HTMLInputElement>("#max-wheels")!;
  const gearMin = root.querySelector<HTMLInputElement>("#gear-min")!;
  const gearMax = root.querySelector<HTMLInputElement>("#gear-max")!;

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
  }

  function buildConstraints(): Constraints {
    const c = {
      ...DEFAULT_CONSTRAINTS,
      gearMin: Number(gearMin.value) || DEFAULT_CONSTRAINTS.gearMin,
      gearMax: Number(gearMax.value) || DEFAULT_CONSTRAINTS.gearMax,
      maxWheels: Number(maxWheels.value) || DEFAULT_CONSTRAINTS.maxWheels,
    };
    try {
      validateConstraints(c);
    } catch {
      throw new Error("Check the gear range: at least 6 teeth, maximum no smaller than minimum, at least 1 wheel.");
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
    };
    if (selected === "custom") {
      state.period = customPeriod.value.trim();
      state.precision = customPrecision.value;
    }
    return state;
  }

  function emit(): void {
    const selected = presetSelect.value;
    customField.hidden = selected !== "custom";
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
        const req: ExactRequest = { kind: "exact", ratio: preset.ratio, constraints };
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
