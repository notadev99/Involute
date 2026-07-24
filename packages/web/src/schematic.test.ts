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
    // assistive-tech label carries the stages and the rotation sense
    expect(svg).toContain('aria-label="Gear train schematic: stage 1 8:59, stage 2 7:63; output turns same sense as driver"');
  });
  it("tags a single mesh as opposite sense to the driver", () => {
    const svg = schematicSvg({ stages: [{ driverTeeth: 6, drivenTeeth: 45 }] });
    expect(svg).toContain("output: opposite sense to driver");
  });
  it("scales radii with teeth, stakes shared arbors concentrically, meshes tangent", () => {
    const svg = schematicSvg({ stages: [
      { driverTeeth: 8, drivenTeeth: 59 },
      { driverTeeth: 7, drivenTeeth: 63 },
    ] });
    const gears = [...svg.matchAll(
      /<circle class="gear-node[^"]*" cx="([\d.]+)" cy="[\d.]+" r="([\d.]+)"[^>]*\/>\s*<text class="tooth-label"[^>]*>(\d+)<\/text>/g,
    )].map((m) => ({ cx: Number(m[1]), r: Number(m[2]), teeth: Number(m[3]) }));
    expect(gears.length).toBe(4);
    const byTeeth = (t: number) => gears.find((g) => g.teeth === t)!;
    // radius carries tooth information
    expect(byTeeth(63).r).toBeGreaterThan(byTeeth(8).r);
    expect(byTeeth(59).r).toBeGreaterThan(byTeeth(7).r);
    // arbor 1 carries the 59-tooth wheel and the 7-leaf pinion on one centre
    expect(byTeeth(59).cx).toBe(byTeeth(7).cx);
    // pitch circles touch: centre distance equals the sum of meshing radii
    expect(byTeeth(59).cx - byTeeth(8).cx).toBeCloseTo(byTeeth(8).r + byTeeth(59).r, 6);
    expect(byTeeth(63).cx - byTeeth(7).cx).toBeCloseTo(byTeeth(7).r + byTeeth(63).r, 6);
  });

  it("marks idlers and counts them in the mesh parity", () => {
    const svg = schematicSvg({ stages: [
      { driverTeeth: 8, drivenTeeth: 59 },
      { driverTeeth: 20, drivenTeeth: 20, isIdler: true },
    ] });
    expect(svg).toContain("idler");
    expect(svg).toContain("output: same sense as driver");
  });

  it("carries fill/stroke as presentation attributes so shapes survive CSS being stripped (e.g. Safari Reader view)", () => {
    const svg = schematicSvg({ stages: [
      { driverTeeth: 8, drivenTeeth: 59 },
      { driverTeeth: 20, drivenTeeth: 20, isIdler: true },
    ] });
    const circles = [...svg.matchAll(/<circle class="gear-node[^"]*"[^>]*>/g)];
    expect(circles.length).toBeGreaterThan(0);
    // every gear circle must declare fill="none" inline — without it, a
    // stylesheet-less render (CSS stripped) falls back to a solid black fill
    for (const circle of circles) {
      expect(circle[0]).toMatch(/fill="none"/);
      expect(circle[0]).toMatch(/stroke="#[0-9a-f]+"/);
    }
    expect(svg).toMatch(/<line class="plate-line"[^>]*stroke="#[0-9a-f]+"[^>]*\/>/);
  });
});
