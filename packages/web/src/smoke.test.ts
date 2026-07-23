import { describe, it, expect } from "vitest";
import { paretoFrontier, DEFAULT_CONSTRAINTS, Rational } from "@involute/engine";

describe("engine wiring", () => {
  it("imports the engine and solves a frontier", () => {
    const f = paretoFrontier(Rational.from(1236827n, 100000n), DEFAULT_CONSTRAINTS);
    expect(f.length).toBeGreaterThan(0);
    expect(f[0].wheels).toBeGreaterThanOrEqual(1);
  });
});
