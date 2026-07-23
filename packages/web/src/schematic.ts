import { type GearTrain, outputParity } from "@involute/engine";

const PAD = 30;
const R_MIN = 7, R_MAX = 64;
// Pitch radius scales with tooth count, clamped so a 6-leaf pinion stays
// legible and a 120-tooth wheel stays on screen.
const radius = (teeth: number) => Math.max(R_MIN, Math.min(R_MAX, 4 + teeth * 0.5));

export function schematicSvg(train: GearTrain): string {
  // Arbor layout, the way a train is actually staked: the stage-i driver rides
  // arbor i-1 and its driven wheel arbor i, so every middle arbor carries a
  // wheel and the next stage's pinion concentrically. Adjacent centres sit at
  // the sum of the meshing pitch radii, so pitch circles touch at each mesh.
  const k = train.stages.length;
  const arborGears: { teeth: number; idler: boolean }[][] = Array.from({ length: k + 1 }, () => []);
  train.stages.forEach((s, i) => {
    arborGears[i].push({ teeth: s.driverTeeth, idler: !!s.isIdler });
    arborGears[i + 1].push({ teeth: s.drivenTeeth, idler: !!s.isIdler });
  });

  const xs: number[] = [];
  let x = PAD + Math.max(...arborGears[0].map((g) => radius(g.teeth)));
  xs.push(x);
  for (const s of train.stages) {
    x += radius(s.driverTeeth) + radius(s.drivenTeeth);
    xs.push(x);
  }

  const rMaxAll = Math.max(...train.stages.flatMap((s) => [radius(s.driverTeeth), radius(s.drivenTeeth)]));
  const cy = PAD + rMaxAll;
  const height = cy + rMaxAll + 24;
  const width = xs[xs.length - 1] + Math.max(...arborGears[k].map((g) => radius(g.teeth))) + PAD;

  const nodes = arborGears.map((gearsOnArbor, i) => {
    // draw the larger gear first so a concentric pinion sits on top of it
    const sorted = [...gearsOnArbor].sort((a, b) => radius(b.teeth) - radius(a.teeth));
    return sorted.map((g, j) => {
      const r = radius(g.teeth);
      // a solo (or the smaller concentric) gear labels at centre; a larger
      // companion labels just inside its own rim so the two never collide
      const labelY = sorted.length > 1 && j === 0 ? cy - r + 14 : cy + 4;
      return `
    <circle class="gear-node${g.idler ? " idler" : ""}" cx="${xs[i]}" cy="${cy}" r="${r}" />
    <text class="tooth-label" x="${xs[i]}" y="${labelY}" text-anchor="middle">${g.teeth}</text>
    ${g.idler ? `<text class="idler-tag" x="${xs[i]}" y="${cy + rMaxAll + 14}" text-anchor="middle">idler</text>` : ""}`;
    }).join("");
  }).join("");

  const baseline = `<line class="plate-line" x1="${PAD}" y1="${cy}" x2="${width - PAD}" y2="${cy}" />`;
  // Mesh parity only fixes the output's sense RELATIVE to the driver — no
  // absolute driver direction exists anywhere in the model, so an absolute
  // CW/CCW tag would be an unverifiable claim.
  const dir = outputParity(train) === 1 ? "same sense as driver" : "opposite sense to driver";
  const dirTag = `<text class="dir-tag" x="${width - PAD}" y="${Math.max(14, cy - rMaxAll - 8)}" text-anchor="end">output: ${dir}</text>`;
  // Describe the train for assistive tech — role="img" makes the child <text>
  // presentational, so everything a sighted user reads must be in the label.
  const stageWords = train.stages
    .map((s, i) => `stage ${i + 1} ${s.isIdler ? `idler ${s.drivenTeeth}` : `${s.driverTeeth}:${s.drivenTeeth}`}`)
    .join(", ");
  const svgLabel = `Gear train schematic: ${stageWords}; output turns ${dir}`;
  return `<svg class="schematic" viewBox="0 0 ${width} ${height}" role="img" aria-label="${svgLabel}">${baseline}${nodes}${dirTag}</svg>`;
}
