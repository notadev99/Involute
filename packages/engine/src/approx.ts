import { Rational, gcd } from "./rational.js";
import { GearStage, GearTrain, trainRatio, totalTeeth } from "./gear.js";
import { Constraints, Solution } from "./types.js";
import { factorAll } from "./factor.js";

function relError(achieved: Rational, target: Rational): number {
  return Math.abs(achieved.sub(target).toNumber() / target.toNumber());
}

// Build a train from a driver-teeth list and a driven-teeth list of equal length.
function makeTrain(driver: number[], driven: number[]): GearTrain {
  const stages: GearStage[] = driver.map((d, i) => ({ driverTeeth: d, drivenTeeth: driven[i] }));
  return { stages };
}

// Count the stages whose driver and driven tooth counts are coprime. A coprime
// pair is a "hunting tooth" set: every leaf eventually meets every tooth, which
// spreads wear evenly. Used only as an opt-in ranking tiebreak (huntingToothBonus).
export function coprimeStages(train: GearTrain): number {
  return train.stages.reduce(
    (n, s) => n + (gcd(BigInt(s.driverTeeth), BigInt(s.drivenTeeth)) === 1n ? 1 : 0),
    0,
  );
}

// All distinct orderings of a short list (k <= maxWheels, so at most a handful).
function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const out: number[][] = [];
  const seen = new Set<number>();
  for (let i = 0; i < arr.length; i++) {
    if (seen.has(arr[i])) continue; // skip duplicate leading values
    seen.add(arr[i]);
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

export function bestTrainForK(target: Rational, k: number, c: Constraints): Solution | null {
  const min = c.gearMin, max = c.gearMax;
  const bmin = BigInt(min), bmax = BigInt(max);
  const tNum = target.toNumber();
  const Pmin = bmin ** BigInt(k); // smallest achievable driven product
  const Pmax = bmax ** BigInt(k); // largest achievable driven product

  // A k-wheel train's ratio lies in [Pmin/Pmax, Pmax/Pmin] — driver and driven
  // products each live in [Pmin, Pmax]. A target outside that band (with a
  // whisker of float slack) can meet no train at this wheel count, so return
  // null up front instead of walking millions of dead subtrees: no in-band
  // candidate ever seeds `best`, so the window pruning cannot engage out here.
  const bandLo = Number(Pmin) / Number(Pmax), bandHi = Number(Pmax) / Number(Pmin);
  if (tNum < bandLo * (1 - 1e-9) || tNum > bandHi * (1 + 1e-9)) return null;

  let best: Solution | null = null;

  const gatePasses = (train: GearTrain) =>
    train.stages.every((s) => s.drivenTeeth / s.driverTeeth <= c.maxStageRatio
                           && s.driverTeeth / s.drivenTeeth <= c.maxStageRatio);

  // Ranking: smallest error first, compared EXACTLY — |achieved - target| as a
  // Rational, never the float errorRel, which rounds two distinct errors onto
  // the same double (or one exact tie onto two doubles) often enough to hand
  // the fewest-teeth tie-break to the wrong train. The float stays on the
  // Solution for display only. When the hunting-tooth bonus is on, equal-error
  // ties prefer more coprime stages before fewer teeth; otherwise fewer teeth
  // wins the tie directly. The bonus never trades away accuracy.
  function exactAbsErr(achieved: Rational): Rational {
    return achieved.sub(target).abs();
  }
  function isBetter(cand: Solution): boolean {
    if (!best) return true;
    const cmp = exactAbsErr(cand.achievedRatio).cmp(exactAbsErr(best.achievedRatio));
    if (cmp !== 0) return cmp < 0;
    if (c.huntingToothBonus) {
      const cc = coprimeStages(cand.train), cb = coprimeStages(best.train);
      if (cc !== cb) return cc > cb;
    }
    return cand.totalTeeth < best.totalTeeth;
  }

  // Turn a driver/driven factor pair into the train we will rank. The sorted
  // pairing is the min-max-stage-ratio pairing, so if it clears the gate every
  // other pairing of the same factors that also clears it has identical teeth
  // and ratio (both pairing-invariant); if it fails, no pairing passes. With the
  // hunting-tooth bonus on, re-pair among gate-passing orderings to maximise
  // coprime stages — this never changes error or teeth, only wear behaviour.
  function buildBestTrain(driver: number[], driven: number[]): GearTrain | null {
    const sorted = makeTrain(driver, driven);
    if (!gatePasses(sorted)) return null;
    if (!c.huntingToothBonus) return sorted;
    let bestTrain = sorted, bestCo = coprimeStages(sorted);
    for (const perm of permutations(driven)) {
      const t = makeTrain(driver, perm);
      if (!gatePasses(t)) continue;
      const co = coprimeStages(t);
      if (co > bestCo) { bestCo = co; bestTrain = t; }
    }
    return bestTrain;
  }

  // For a fixed driver product Q, the relative error |P/Q - target| is monotonic
  // in |P - target*Q|, so the best driven product P for this Q is the NEAREST
  // integer to target*Q that both factors into k in-range gears and clears the
  // stage-ratio gate. Walk outward in one direction until we hit such a P (all
  // farther ones are strictly worse for this Q), stopping early once the distance
  // can no longer beat the best error found so far, or we leave the product range.
  function scan(factors: number[], product: bigint, tQ: number, startP: number, step: number) {
    for (let Pn = startP; ; Pn += step) {
      const Pb = BigInt(Pn);
      if (Pb < Pmin || Pb > Pmax) return;
      // A P this far out cannot improve on the current best, and everything
      // beyond is farther still, so stop scanning this direction. The bound is
      // a float, so give it a hair of slack and let the exact comparison in
      // isBetter decide anything near the line.
      if (best && Math.abs(Pn - tQ) / tQ > best.errorRel * (1 + 1e-12) + Number.EPSILON) return;
      let hit = false;
      for (const driven of factorAll(Pb, k, min, max)) {
        const train = buildBestTrain(factors, driven);
        if (!train) continue;
        hit = true;
        const achieved = trainRatio(train);
        const cand: Solution = {
          train, achievedRatio: achieved, errorRel: relError(achieved, target),
          wheels: k, totalTeeth: totalTeeth(train),
        };
        if (isBetter(cand)) best = cand;
      }
      // Nearest gate-passing P in this direction found; farther ones are worse.
      if (hit) return;
    }
  }

  // Enumerate driver-side products Q as k in-range factors (sorted, no permutations).
  // Subtrees are pruned by a reachability window: driven products only exist in
  // [Pmin, Pmax], so a subtree can only beat the current best error eps if some
  // completed Q puts target*Q inside [Pmin/(1+eps), Pmax/(1-eps)] (the exact
  // bounds at which the nearest in-range P ties eps; a hair of margin keeps
  // equal-error tiebreak candidates alive across float rounding). With factors
  // non-decreasing, choosing f next bounds the completed product to
  // [product*f^slots, product*f*max^(slots-1)] — and once the smallest
  // reachable target*Q overshoots the window, no larger f can recover.
  const PminN = Number(Pmin), PmaxN = Number(Pmax);
  function enumQ(slots: number, floor: number, factors: number[], product: bigint) {
    if (slots === 0) {
      const tQ = tNum * Number(product);
      const floorP = Math.floor(tQ);
      scan(factors, product, tQ, floorP, -1);    // nearest gate-passing P at or below target*Q
      scan(factors, product, tQ, floorP + 1, 1); // nearest gate-passing P above target*Q
      return;
    }
    const base = tNum * Number(product);
    for (let f = floor; f <= max; f++) {
      const qLo = base * f ** slots;
      const qHi = base * f * max ** (slots - 1);
      // scan() only ever yields for a Q whose floor(target*Q) lands inside
      // [Pmin-1, Pmax] — outside that, the walk exits before producing a
      // candidate — so subtrees whose whole reachable interval misses the
      // window are dead regardless of the current best. A best tightens the
      // window further to the error it must beat.
      let lo = PminN - 1, hi = PmaxN + 1;
      if (best) {
        const eps = best.errorRel * (1 + 1e-9) + Number.EPSILON;
        lo = Math.max(lo, PminN / (1 + eps));
        if (eps < 1) hi = Math.min(hi, PmaxN / (1 - eps));
      }
      if (qLo > hi) break;    // ascending f: every later subtree overshoots too
      if (qHi < lo) continue; // undershoots even fully maxed; larger f may not
      enumQ(slots - 1, f, [...factors, f], product * BigInt(f));
    }
  }
  enumQ(k, min, [], 1n);
  return best;
}

export function paretoFrontier(target: Rational, c: Constraints): Solution[] {
  const out: Solution[] = [];
  let bestErr = Infinity;
  for (let k = 1; k <= c.maxWheels; k++) {
    const s = bestTrainForK(target, k, c);
    if (s && s.errorRel < bestErr) { out.push(s); bestErr = s.errorRel; }
  }
  return out;
}
