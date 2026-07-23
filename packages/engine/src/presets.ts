// Catalog of named targets a user can pick instead of typing raw numbers.
//
// Two kinds of preset:
//  - ApproxPreset: a real-world period (in days, unless noted) that has no
//    exact rational value, so the engine has to search for the closest
//    achievable gear ratio. Every entry cites the source of its published
//    value.
//  - ExactPreset: a ratio that a real complication drives exactly (e.g. an
//    hour wheel to a 12-hour dial), so the engine can solve it directly
//    instead of approximating.
import { Rational } from "./rational.js";

export interface ApproxPreset {
  id: string;
  name: string;
  value: string;
  precisionDigits: number;
  uncertainty: number;
  unit: string;
  source: string;
  driverNote: string;
  // How many target periods one display revolution spans — 2 for the classic
  // double-moon disc, 1 for everything else. The UI seeds its multiplicity
  // field from this when the preset is chosen.
  defaultMultiplicity: number;
}

export interface ExactPreset {
  id: string;
  name: string;
  ratio: Rational;
  note?: string;
  mechanismDeferred?: string;
}

export const APPROX_PRESETS: ApproxPreset[] = [
  { id: "synodic-month", name: "Synodic month (moon phase)", value: "29.530589", precisionDigits: 6,
    uncertainty: 1e-6, unit: "day", source: "Meeus, Astronomical Algorithms",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 2 },
  { id: "draconic-month", name: "Draconic month", value: "27.212221", precisionDigits: 6,
    uncertainty: 1e-6, unit: "day", source: "Meeus, Astronomical Algorithms",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 1 },
  { id: "anomalistic-month", name: "Anomalistic month", value: "27.554550", precisionDigits: 6,
    uncertainty: 1e-6, unit: "day", source: "Meeus, Astronomical Algorithms",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 1 },
  { id: "sidereal-month", name: "Sidereal month", value: "27.321662", precisionDigits: 6,
    uncertainty: 1e-6, unit: "day", source: "Meeus, Astronomical Algorithms",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 1 },
  { id: "tropical-year", name: "Tropical year", value: "365.242190", precisionDigits: 6,
    uncertainty: 1e-6, unit: "day", source: "IAU",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 1 },
  { id: "sidereal-year", name: "Sidereal year", value: "365.256363", precisionDigits: 6,
    uncertainty: 1e-6, unit: "day", source: "IAU",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 1 },
  { id: "mean-tide", name: "Mean semidiurnal tide (days)", value: "0.517525", precisionDigits: 6,
    uncertainty: 1e-6, unit: "day", source: "derived: half mean lunar day (24 h 50.5 min / 2)",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 1 },
  { id: "lunations-per-year", name: "Lunations per tropical year (Metonic/Saros target)",
    value: "12.368266", precisionDigits: 6, uncertainty: 1e-6, unit: "lunation/year",
    source: "derived: tropical/synodic",
    driverNote: "driven continuously at 1 rev/day (24 h driver, the default driver period)", defaultMultiplicity: 1 },
];

export const EXACT_PRESETS: ExactPreset[] = [
  { id: "motion-works", name: "Motion works (hour:minute)", ratio: Rational.from(12) },
  { id: "gmt-24h", name: "GMT / 2nd-zone 24h hand", ratio: Rational.from(2),
    note: "off the 12h wheel" },
  { id: "worldtimer-city", name: "Worldtimer city ring", ratio: Rational.from(24),
    note: "24 steps/day; corrector deferred" },
  { id: "date-31", name: "Date ring", ratio: Rational.from(31),
    note: "stepping; QP leap cam deferred" },
  { id: "day-7", name: "Day-of-week", ratio: Rational.from(7) },
  { id: "month-12", name: "Month ring", ratio: Rational.from(12) },
  { id: "leap-48", name: "4-year / 48-month leap wheel", ratio: Rational.from(48),
    note: "gear side only; cam deferred" },
  { id: "chrono-30min", name: "30-minute chrono counter", ratio: Rational.from(30),
    note: "counter train; clutch deferred" },
  { id: "chrono-12h", name: "12-hour chrono counter", ratio: Rational.from(12),
    note: "counter train; clutch deferred" },
  // These four are gear-side ratio components only; the display's stepping,
  // return, or clutch action is not modelled (see project non-goals). Unlike
  // the rows above, none of these have one universal industry-standard ratio
  // (retrograde span, wandering-hours disc count, and power-reserve gearing
  // all vary by movement), so the value here is a representative default,
  // not a sourced specification, and callers should treat it as illustrative.
  { id: "jump-hour", name: "Jump hour", ratio: Rational.from(12),
    note: "digital hour display, same 12-position cadence as motion works",
    mechanismDeferred: "stepping/return mechanism not modelled" },
  { id: "retrograde-drive", name: "Retrograde drive", ratio: Rational.from(60),
    note: "representative span (retrograde seconds); actual span is display-specific",
    mechanismDeferred: "stepping/return mechanism not modelled" },
  { id: "wandering-hours", name: "Wandering hours", ratio: Rational.from(3),
    note: "representative 3-disc carrier (each disc spans 4h); disc count varies by design",
    mechanismDeferred: "stepping/return mechanism not modelled" },
  { id: "power-reserve", name: "Power reserve indicator", ratio: Rational.from(1),
    note: "representative placeholder; real gearing depends on barrel turns and spring reserve",
    mechanismDeferred: "stepping/return mechanism not modelled" },
];
