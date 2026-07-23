import { describe, it, expect } from "vitest";
import { schematicSvg } from "./schematic.js";

describe("schematic", () => {
  it("draws one labelled node per gear plus a direction indicator", () => {
    const svg = schematicSvg({ stages: [
      { driverTeeth: 8, drivenTeeth: 59 },
      { driverTeeth: 7, drivenTeeth: 63 },
    ] });
    expect(svg).toContain("<svg");
    // 2 stages -> 4 tooth labels
    expect((svg.match(/class="tooth-label"/g) ?? []).length).toBe(4);
    expect(svg).toContain(">8<");
    expect(svg).toContain(">59<");
    expect(svg).toMatch(/CW|CCW/); // output direction shown
  });
  it("marks idlers", () => {
    const svg = schematicSvg({ stages: [{ driverTeeth: 20, drivenTeeth: 20, isIdler: true }] });
    expect(svg).toContain("idler");
  });
});
