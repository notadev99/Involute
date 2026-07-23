import {
  APPROX_PRESETS, EXACT_PRESETS, DEFAULT_CONSTRAINTS, parseDecimal,
  type Constraints,
} from "@involute/engine";
import type { ApproxRequest, ExactRequest } from "../solve.js";

const DEFAULT_PRESET_ID = "synodic-month";
// Fixed precision used only for parsing the driver-period and custom-target
// text fields into Rationals; unrelated to a preset's own precisionDigits.
const FIELD_PRECISION_DIGITS = 6;

export function renderInputPanel(onChange: (req: ApproxRequest | ExactRequest) => void): HTMLElement {
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
      <label for="multiplicity">Display multiplicity</label>
      <input id="multiplicity" type="number" min="1" value="2" />
    </div>
    <div class="field">
      <label for="max-wheels">Max wheels</label>
      <input id="max-wheels" type="number" min="1" value="${DEFAULT_CONSTRAINTS.maxWheels}" />
    </div>
    <div class="field gear-range">
      <label for="gear-min">Gear range</label>
      <input id="gear-min" type="number" min="1" value="${DEFAULT_CONSTRAINTS.gearMin}" />
      <span class="range-sep">–</span>
      <input id="gear-max" type="number" min="1" value="${DEFAULT_CONSTRAINTS.gearMax}" />
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

  function buildConstraints(): Constraints {
    return {
      ...DEFAULT_CONSTRAINTS,
      gearMin: Number(gearMin.value) || DEFAULT_CONSTRAINTS.gearMin,
      gearMax: Number(gearMax.value) || DEFAULT_CONSTRAINTS.gearMax,
      maxWheels: Number(maxWheels.value) || DEFAULT_CONSTRAINTS.maxWheels,
    };
  }

  function emit(): void {
    const selected = presetSelect.value;
    customField.hidden = selected !== "custom";

    const constraints = buildConstraints();
    const driverPeriodDays = parseDecimal(driverPeriod.value.trim() || "1", FIELD_PRECISION_DIGITS);
    const displayMultiplicity = Number(multiplicity.value) || 1;

    if (selected.startsWith("exact:")) {
      const id = selected.slice("exact:".length);
      const preset = EXACT_PRESETS.find((p) => p.id === id);
      if (!preset) return;
      const req: ExactRequest = { kind: "exact", ratio: preset.ratio, constraints };
      onChange(req);
      return;
    }

    if (selected === "custom") {
      const periodDays = customPeriod.value.trim();
      const precisionDigits = Number(customPrecision.value) || FIELD_PRECISION_DIGITS;
      const req: ApproxRequest = {
        kind: "approx", periodDays, precisionDigits, uncertainty: 10 ** -precisionDigits,
        driverPeriodDays, displayMultiplicity, constraints,
      };
      onChange(req);
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
    onChange(req);
  }

  root.addEventListener("input", emit);
  root.addEventListener("change", emit);
  return root;
}
