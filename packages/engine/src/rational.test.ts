import { describe, it, expect } from "vitest";
import { Rational, gcd } from "./rational.js";

describe("Rational", () => {
  it("reduces on construction and normalises sign to the numerator", () => {
    const r = Rational.from(6n, -8n);
    expect(r.n).toBe(-3n);
    expect(r.d).toBe(4n);
  });
  it("multiplies and divides exactly", () => {
    const r = Rational.from(59, 2).mul(Rational.from(2, 59));
    expect(r.equals(Rational.from(1))).toBe(true);
  });
  it("compares without float error", () => {
    expect(Rational.from(1, 3).cmp(Rational.from(2, 6))).toBe(0);
    expect(Rational.from(1, 3).cmp(Rational.from(1, 2))).toBe(-1);
  });
  it("rejects a zero denominator", () => {
    expect(() => Rational.from(1n, 0n)).toThrow();
  });
  it("gcd is sign-agnostic", () => {
    expect(gcd(-12n, 8n)).toBe(4n);
  });
});
