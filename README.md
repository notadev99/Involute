# Involute

A precise gear-train calculator for watchmaking. Give it a target ratio or a
real-world period, and it computes the tooth counts that hit it, the exact
residual error, and a schematic of the train. Every figure is computed in your
browser from exact rational arithmetic. No server, no network, no guesswork.

## Validation

Involute reproduces known trains from the horological and astronomical record.
These come straight from the engine's golden fixtures and reference database:
the same numbers the test suite checks on every commit. Each row cites where
its target value comes from.

| Train | What it should be | Involute reproduces | Residual error | Source |
| --- | --- | --- | --- | --- |
| Moon phase (frontier) | Double-moon disc, 2 lunations per turn, from synodic 29.530589 d | `6:45 · 8:63` (driver:driven) = 945/16, so 29.531250 d per lunation — the simplest frontier row under the default constraints | 2.238 × 10⁻⁵ relative; runs slow by ≈ 1 day every 122 years | Synodic month: Meeus, *Astronomical Algorithms*. |
| Metonic cycle | 235 lunations = 19 tropical years | `6:30 · 19:47` (driver:driven) = 235/19 exactly, via the exact solver | 235/19 itself sits 1.5 × 10⁻⁴ absolute (1.2 × 10⁻⁵ relative) from the astronomical target 12.368266 | Meton of Athens (432 BC). Target derived from tropical ÷ synodic month (Meeus). |
| Motion works | Hour hand : minute hand = 1 : 12 | `12 / 1`, solved exactly | 0 (exact) | Standard horological gearing. |
| ETA 6497 going train | Centre wheel → escape wheel gear ratio | Tooth counts pending a confirmed primary source | — | ETA 6497-1 service sheet (tooth counts not yet sourced — see below). |

The moon frontier row above is checked end to end (target through frontier,
achieved period, and correction) in
[`packages/web/src/solve.test.ts`](packages/web/src/solve.test.ts); the Metonic
figures and the reference database's source-gating rule are checked in the engine
([`golden.test.ts`](packages/engine/src/golden.test.ts),
[`reference.ts`](packages/engine/src/reference.ts)).

Asked to *approximate* the lunations-per-year target rather than reproduce
235/19, the engine does better than Meton: its two-stage frontier row
`6:43 · 62:107` = 4601/372 ≈ 12.368280 lands about twelve times closer to the
astronomical value than the Metonic fraction. The classical 235/19 never
appears on the approximation frontier for exactly that reason; it is
reproduced through the exact solver instead, as the table shows.

The historical `59/2` = 29.5 d "classic double-moon" is a *stepped* mechanism: a
1-tooth pinion driving a 59-tooth wheel, advanced by a jumper. The
continuous-gear engine does not reproduce it, because a 1:59 stage exceeds the
default single-stage ratio limit. Stepped displays are listed under "what it
does not do" below.

A benchmark with no confirmed source is never used to label a result. The
reference database keeps unsourced candidates (for example, precision-moon
trains attributed to specific calibers) visible in the list but excludes them
from matching at runtime, so Involute never prints an accuracy figure it cannot
back with a citation. The ETA 6497 row above is deliberately left blank for the
same reason: its tooth counts are marked "from the service sheet" until a copy
is confirmed.

## What it does, and what it does not

**Does:**

- Finds the tooth counts for a target ratio, either exactly (Diophantine solve)
  or as the closest achievable train (a Pareto frontier of the best constrained
  rational approximations), under tooth-count and wheel-count constraints.
- Reports the residual error as a human interval ("about 1 day every 2.6
  years") and a drift direction (fast / slow).
- Draws the resulting train as an SVG schematic and exports it, plus the results
  table, as JSON, CSV, or a print-ready spec sheet.
- Labels a computed train against known movements when, and only when, a
  confirmed source exists.

**Does not (deferred):**

- Perpetual-calendar leap cam
- Equation-of-time cam
- Escapement geometry (Involute models gear ratios, not the escapement)
- Correctors, stepping, return, and clutch mechanisms for stepped displays

These are gearing-adjacent mechanisms, not gear ratios, and are out of scope for
this version. Where a preset touches one (a date ring, a leap wheel), the engine
solves the gear side only and marks the mechanism as deferred.

## Try it

**[notadev99.github.io/Involute](https://notadev99.github.io/Involute/)**. Runs
entirely in your browser. Nothing is sent anywhere.

## The math, in brief

A gear ratio is a rational number, so hitting a target ratio exactly is a
Diophantine problem: find integer tooth counts whose product ratio equals the
target, within the physical tooth-count limits. When the target is irrational
or has no train inside the constraints (a real astronomical period, say),
Involute falls back to approximation: for each wheel count it enumerates every
admissible driver-gear combination and, for each, the nearest achievable driven
combination — an exhaustive search for the best train the constraints allow,
not just the classical convergents (a convergent's denominator need not factor
into real gears). The result is a Pareto frontier trading train complexity
against residual error — you pick the point that fits the movement.

Continued fractions still set the theoretical yardstick (Khinchin): the moon
train's 945/16 is in fact the second convergent of the double-lunation target.
The search just refuses to stop there when the constraints hold something
better.

What is exact, precisely: tooth counts, achieved ratios, and every comparison
inside the solver are integer and rational arithmetic on BigInt. The residual
errors and correction intervals are *reported* to double precision, which is
more than any gear train can use.

This is the same idea behind the Antikythera mechanism's lunar and Metonic
trains, and the lineage runs through Ludwig Oechslin's modern astronomical
calendars, which reduce complications to small, exact gear trains. Involute is a
calculator for that kind of work, not a designer of movements.

References: continued fractions and best rational approximation (Khinchin,
*Continued Fractions*); the Antikythera gearing (Freeth et al., *Nature*, 2006);
Oechslin's reduction-to-gearing approach to astronomical complications.

## Contributing

New presets and reference-database benchmarks are welcome — with one firm rule:
**a benchmark PR must include a confirmed primary source** (a patent, a
manufacturer service sheet, or graded horological literature). PRs without a
source are declined. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a
preset or benchmark and how to run the tests and build.

## License

MIT © Thomas Brenas. See [LICENSE](LICENSE).
