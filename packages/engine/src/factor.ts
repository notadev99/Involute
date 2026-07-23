export function factorInto(value: bigint, k: number, min: number, max: number): number[] | null {
  const bmin = BigInt(min), bmax = BigInt(max);
  function rec(v: bigint, slots: number, floor: bigint): number[] | null {
    if (slots === 1) {
      if (v >= floor && v >= bmin && v <= bmax) return [Number(v)];
      return null;
    }
    // choose the next factor f (>= floor to avoid permutations), f divides v, remainder placeable
    for (let f = floor < bmin ? bmin : floor; f <= bmax; f++) {
      if (v % f !== 0n) continue;
      const rest = v / f;
      // prune: remaining slots-1 factors each <= max must be able to reach `rest`
      if (rest > bmax ** BigInt(slots - 1)) continue;
      const sub = rec(rest, slots - 1, f);
      if (sub) return [Number(f), ...sub];
    }
    return null;
  }
  if (k < 1) return null;
  return rec(value, k, bmin);
}

// Yield every ascending factorization of `value` into k factors in [min,max].
// factorInto returns only the first split; the solvers need all of them to pick
// the fewest-teeth split and the one that clears the stage-ratio gate. Factors
// are yielded non-decreasing, so pairing positionally against a sorted driver
// list gives the sorted-sorted pairing the solvers rely on.
export function* factorAll(value: bigint, k: number, min: number, max: number): Generator<number[]> {
  const bmin = BigInt(min), bmax = BigInt(max);
  if (k < 1) return;
  function* rec(v: bigint, slots: number, floor: bigint): Generator<number[]> {
    if (slots === 1) {
      if (v >= floor && v >= bmin && v <= bmax) yield [Number(v)];
      return;
    }
    for (let f = floor < bmin ? bmin : floor; f <= bmax; f++) {
      if (v % f !== 0n) continue;
      const rest = v / f;
      // prune: the remaining slots-1 factors each <= max must be able to reach `rest`
      if (rest > bmax ** BigInt(slots - 1)) continue;
      for (const sub of rec(rest, slots - 1, f)) yield [Number(f), ...sub];
    }
  }
  yield* rec(value, k, bmin);
}
