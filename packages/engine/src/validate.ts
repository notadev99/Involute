import { Rational } from "./rational.js";
import { Constraints } from "./types.js";

export const DEFAULT_CONSTRAINTS: Constraints = {
  gearMin: 6, gearMax: 120, maxStageRatio: 10, maxWheels: 4, huntingToothBonus: false,
};

export function parseDecimal(value: string, precisionDigits: number): Rational {
  if (!/^-?\d+(\.\d+)?$/.test(value)) throw new Error(`parseDecimal: bad number "${value}"`);
  const [intPart, fracPart = ""] = value.split(".");
  // Round to nearest, ties away from zero, so small targets are not biased low
  // and a value below 10^-precisionDigits does not collapse to 0. Inspect the
  // first dropped digit and let a BigInt carry propagate into the integer part.
  const kept = fracPart.slice(0, precisionDigits).padEnd(precisionDigits, "0");
  const nextDigit = fracPart.charAt(precisionDigits); // "" when nothing was dropped
  const scale = 10n ** BigInt(precisionDigits);
  const sign = intPart.startsWith("-") ? -1n : 1n;
  let digits = BigInt((intPart.replace("-", "") || "0") + kept);
  if (nextDigit && Number(nextDigit) >= 5) digits += 1n;
  return Rational.from(sign * digits, scale);
}

export function validateApproxTarget(t: { value: string; precisionDigits: number }): void {
  const r = parseDecimal(t.value, t.precisionDigits);
  if (r.cmp(Rational.from(0)) <= 0) throw new Error("validateApproxTarget: period/ratio must be positive");
}

export function validateConstraints(c: Constraints): void {
  if (c.gearMin < 6) throw new Error("gearMin must be >= 6");
  if (c.gearMax < c.gearMin) throw new Error("gearMax must be >= gearMin");
  if (c.maxWheels < 1) throw new Error("maxWheels must be >= 1");
  if (c.pinionMin !== undefined && (c.pinionMin < c.gearMin || c.pinionMin > c.gearMax)) {
    throw new Error("pinionMin must lie within the gear range");
  }
}
