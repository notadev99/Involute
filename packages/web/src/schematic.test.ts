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
    // 2 meshes -> even parity -> same sense; relative wording only, never
    // absolute CW/CCW (no driver direction exists in the model)
    expect(svg).toContain("output: same sense as driver");
    expect(svg).not.toMatch(/\bCC?W\b/);
  });
  it("tags a single mesh as opposite sense to the driver", () => {
    const svg = schematicSvg({ stages: [{ driverTeeth: 6, drivenTeeth: 45 }] });
    expect(svg).toContain("output: opposite sense to driver");
  });
  it("marks idlers and counts them in the mesh parity", () => {
    const svg = schematicSvg({ stages: [
      { driverTeeth: 8, drivenTeeth: 59 },
      { driverTeeth: 20, drivenTeeth: 20, isIdler: true },
    ] });
    expect(svg).toContain("idler");
    expect(svg).toContain("output: same sense as driver");
  });
});
