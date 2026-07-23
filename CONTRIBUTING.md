# Contributing to Involute

Thanks for helping. Involute's value is that every number it prints can be
traced to a source. Contributions that add targets or benchmarks are held to
that standard.

## Setup

```bash
pnpm install          # Node 24, pnpm workspaces
pnpm -r test          # run the full test suite (engine + web)
pnpm -r build         # type-check and build both packages
pnpm --filter @involute/web dev   # run the web app locally
```

The engine (`@involute/engine`) is plain TypeScript with no runtime
dependencies. The web app (`@involute/web`) depends only on the engine; Vite,
Vitest, and happy-dom are dev dependencies. All computation is client-side.

## Adding an approximation preset

An approximation preset is a real-world period with no exact rational value, so
the engine searches for the closest achievable train. Add an entry to
`APPROX_PRESETS` in [`packages/engine/src/presets.ts`](packages/engine/src/presets.ts):

```ts
{
  id: "sidereal-day", name: "Sidereal day", value: "0.997270",
  precisionDigits: 6, uncertainty: 1e-6, unit: "day",
  source: "IAU",                          // required — where the value comes from
  driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)",
}
```

Every field is required. `source` must name a real, checkable reference — not
"common knowledge". `uncertainty` sets how tight the match has to be.

## Adding an exact preset

An exact preset is a ratio a real complication drives exactly (an hour wheel to
a 12-hour dial, for example). Add it to `EXACT_PRESETS` in the same file:

```ts
{ id: "gmt-24h", name: "GMT / 2nd-zone 24h hand", ratio: Rational.from(2),
  note: "off the 12h wheel" }
```

If the ratio is a representative default rather than one universal
industry-standard value, say so in `note`, and set `mechanismDeferred` when the
display's stepping/return/clutch action is not modelled. Do not present a
representative default as a sourced specification.

## Adding a reference-DB benchmark

The reference database
([`packages/engine/src/reference.ts`](packages/engine/src/reference.ts)) is what
lets Involute say "that's the classic 59-tooth moon train". A benchmark labels a
user's computed train against a known movement, so the bar is higher:

**A benchmark PR must include a confirmed primary source — a patent, a
manufacturer service sheet, or graded horological literature. PRs without a
source are declined.**

This is not a style preference. The engine filters out any entry whose `source`
is `null` before matching, so a sourceless benchmark will never label a result
anyway — it only sits in the list as a visible, unverified candidate. Add your
entry with a real citation:

```ts
{ id: "my-movement", label: "Maker Caliber 123 precision moon train",
  targetId: "synodic-month", achievedPeriod: 29.530589,
  source: "Patent US-XXXXXXX, fig. 3" }   // null is not acceptable for a live benchmark
```

If you have a candidate but not yet a confirmed source, you may add it with
`source: null` so others can help verify it — but it stays excluded from
matching until the source lands. Never state a caliber's accuracy figure as
fact without the citation to back it.

## Tests

Add or update tests alongside your change. Golden fixtures for known trains live
in [`packages/engine/src/golden.test.ts`](packages/engine/src/golden.test.ts).
Every PR runs `pnpm -r test` and `pnpm -r build` in CI on Node 24; both must be
green.

## Scope

Involute is a gear-train calculator. It models gear ratios — not escapement
geometry, leap cams, equation-of-time cams, or stepping/return/clutch
mechanisms. Contributions that stay inside the gearing problem are the easiest
to land.
