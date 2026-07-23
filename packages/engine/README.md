# @involute/engine

The solver behind [Involute](https://github.com/notadev99/Involute): exact
gear-train computation for watchmaking. Pure TypeScript, BigInt rational
arithmetic throughout, zero runtime dependencies.

Two modes:

- **Exact** — a target ratio is a Diophantine problem: find integer tooth
  counts whose train ratio equals it, within physical constraints.
- **Approximation** — a real astronomical period rarely has an exact train.
  The solver searches every admissible combination and returns a Pareto
  frontier trading train complexity against residual error.

## Usage

```ts
import {
  solveExact, paretoFrontier, correction, Rational, DEFAULT_CONSTRAINTS,
} from "@involute/engine";

// Motion works: hour hand turns once per 12 minute-hand turns — exact.
const motionWorks = solveExact(Rational.from(12), DEFAULT_CONSTRAINTS);
// -> trains achieving exactly 12:1, fewest teeth first

// Moon phase: 2 lunations per disc turn from a 1-day driver.
// Target is the period multiplier 2 x 29.530589.
const target = Rational.from(59061178n, 1000000n);
const frontier = paretoFrontier(target, DEFAULT_CONSTRAINTS);
// -> one best train per wheel count; frontier[1] is 6:45 · 8:63 = 945/16

// How far off is that train, in words a watchmaker uses?
const best = frontier[frontier.length - 1];
const drift = correction(
  best.achievedRatio.toNumber() / 2, // achieved days per lunation
  29.530589, 1e-6, "day", 1,
);
// -> { humanInterval: "about 1 day every N years", direction: "slow", ... }
```

Tooth counts, ratios, and every ranking comparison are exact; residuals are
reported to double precision. See the
[project README](https://github.com/notadev99/Involute#readme) for the
validation table and what the solver deliberately does not model.

MIT © Thomas Brenas.
