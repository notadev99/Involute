import { describe, it, expect } from "vitest";
import { factorInto, factorAll } from "./factor.js";

describe("factorInto", () => {
  it("factors a product into k in-range factors", () => {
    const f = factorInto(1440n, 2, 6, 120); // 1440 = 12*120 or 20*72 ...
    expect(f).not.toBeNull();
    expect(f!.length).toBe(2);
    expect(f!.reduce((a, b) => a * b, 1)).toBe(1440);
    expect(f!.every((x) => x >= 6 && x <= 120)).toBe(true);
  });
  it("returns null when a prime can't be placed in range", () => {
    expect(factorInto(127n, 1, 6, 120)).toBeNull();   // 127 prime > 120
    expect(factorInto(127n, 2, 6, 120)).toBeNull();   // 127 prime, no 2-factor split
  });
  it("handles k=1", () => { expect(factorInto(59n, 1, 6, 120)).toEqual([59]); });
});

describe("factorAll", () => {
  it("yields EVERY ascending factorization, not just the first", () => {
    // factorInto returns only [8,8,21]; factorAll must also surface [8,12,14].
    const all = [...factorAll(1344n, 3, 8, 21)].map((f) => f.join(","));
    expect(all).toContain("8,8,21");
    expect(all).toContain("8,12,14");
    // every split multiplies back and stays in range
    for (const f of factorAll(1344n, 3, 8, 21)) {
      expect(f.reduce((a, b) => a * b, 1)).toBe(1344);
      expect(f.every((x) => x >= 8 && x <= 21)).toBe(true);
    }
  });
  it("yields nothing when no in-range split exists", () => {
    expect([...factorAll(127n, 2, 6, 120)]).toEqual([]);
  });
});
