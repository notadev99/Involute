import { describe, it, expect } from "vitest";
import { formatError, formatTeeth, formatInterval } from "./format.js";

describe("format", () => {
  it("formats error compactly", () => {
    expect(formatError(0)).toBe("exact");
    expect(formatError(0.00031)).toMatch(/e-4$/);
  });
  it("formats a train's teeth per stage", () => {
    const train = { stages: [{ driverTeeth: 8, drivenTeeth: 59 }, { driverTeeth: 7, drivenTeeth: 63 }] };
    expect(formatTeeth(train)).toBe("8:59 · 7:63");
  });
  it("formats a correction interval with direction", () => {
    expect(formatInterval("about 1 day every ~2.7 years", "fast")).toContain("runs fast");
    expect(formatInterval("beyond the precision of the published value", "exact")).toBe("no correction needed");
    // below the constant's precision, no direction claim is printed
    expect(
      formatInterval("beyond the precision of the published value", "fast", true),
    ).toBe("beyond the precision of the published value");
  });
});
