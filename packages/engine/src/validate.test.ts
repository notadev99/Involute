import { describe, it, expect } from "vitest";
import { parseDecimal, validateApproxTarget, DEFAULT_CONSTRAINTS } from "./validate.js";
import { Rational } from "./rational.js";

describe("validation + parsing", () => {
  it("parses a decimal string to an exact Rational at precision", () => {
    expect(parseDecimal("29.530589", 6).equals(Rational.from(29530589n, 1000000n))).toBe(true);
  });
  it("rejects a non-positive period", () => {
    expect(() => validateApproxTarget({ value: "0", precisionDigits: 0 } as any)).toThrow();
  });
  it("rounds to nearest instead of truncating toward zero", () => {
    // truncation gave 12.3682; nearest 4-digit value is 12.3683
    expect(parseDecimal("12.368267", 4).equals(Rational.from(123683n, 10000n))).toBe(true);
  });
  it("keeps a small positive target positive instead of collapsing it to 0", () => {
    // 0.0009 @ 3 digits truncated to 0/1, wrongly failing validateApproxTarget
    expect(parseDecimal("0.0009", 3).equals(Rational.from(1n, 1000n))).toBe(true);
    expect(() => validateApproxTarget({ value: "0.0009", precisionDigits: 3 })).not.toThrow();
  });
  it("ships sane defaults", () => {
    expect(DEFAULT_CONSTRAINTS.gearMin).toBe(6);
    expect(DEFAULT_CONSTRAINTS.gearMax).toBe(120);
  });
});
