import { type GearTrain, outputParity } from "@involute/engine";

const R = 22;      // node radius
const GAP = 66;    // horizontal gap between gears
const PAD = 30;

export function schematicSvg(train: GearTrain): string {
  const gears: { x: number; teeth: number; role: "driver" | "driven"; idler: boolean }[] = [];
  let x = PAD;
  for (const s of train.stages) {
    gears.push({ x, teeth: s.driverTeeth, role: "driver", idler: !!s.isIdler });
    x += GAP;
    gears.push({ x, teeth: s.drivenTeeth, role: "driven", idler: !!s.isIdler });
    x += GAP;
  }
  const width = x - GAP + PAD;
  const cy = PAD + R;
  const height = cy + R + 24;
  const nodes = gears.map((g) => `
    <circle class="gear-node${g.idler ? " idler" : ""}" cx="${g.x}" cy="${cy}" r="${R}" />
    <text class="tooth-label" x="${g.x}" y="${cy + 4}" text-anchor="middle">${g.teeth}</text>
    ${g.idler ? `<text class="idler-tag" x="${g.x}" y="${cy + R + 14}" text-anchor="middle">idler</text>` : ""}`).join("");
  const baseline = `<line class="plate-line" x1="${PAD}" y1="${cy}" x2="${width - PAD}" y2="${cy}" />`;
  // Mesh parity only fixes the output's sense RELATIVE to the driver — no
  // absolute driver direction exists anywhere in the model, so an absolute
  // CW/CCW tag would be an unverifiable claim.
  const dir = outputParity(train) === 1 ? "same sense as driver" : "opposite sense to driver";
  const dirTag = `<text class="dir-tag" x="${width - PAD}" y="${cy - R - 8}" text-anchor="end">output: ${dir}</text>`;
  return `<svg class="schematic" viewBox="0 0 ${width} ${height}" role="img" aria-label="gear train schematic">${baseline}${nodes}${dirTag}</svg>`;
}
