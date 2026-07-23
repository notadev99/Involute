// Serializes the input panel's fields into a URL fragment so a solved train is
// a shareable link, and restores them on load. Only values that pass the shape
// checks below are ever applied — a mangled or hostile fragment degrades to
// the defaults instead of feeding garbage (or markup) into the panel.

export interface PanelState {
  target: string; // preset-select value: "approx:<id>", "exact:<id>", "custom", "custom-ratio", or "going-train"
  period?: string; // custom target period, days
  precision?: string; // custom precision digits
  num?: string; // custom exact ratio numerator
  den?: string; // custom exact ratio denominator
  bph?: string; // going-train beat rate
  escape?: string; // going-train escape-wheel teeth
  driver: string; // driver period, days
  mult: string; // display multiplicity
  wheels: string; // max wheels
  gearMin: string;
  gearMax: string;
}

const KEYS: [keyof PanelState, string, RegExp][] = [
  ["target", "t", /^(approx:[a-z0-9-]+|exact:[a-z0-9-]+|custom|custom-ratio|going-train)$/],
  ["period", "cp", /^\d+(\.\d+)?$/],
  ["precision", "cd", /^\d{1,2}$/],
  ["num", "rn", /^\d{1,9}$/],
  ["den", "rd", /^\d{1,9}$/],
  ["bph", "b", /^\d{1,6}$/],
  ["escape", "e", /^\d{1,3}$/],
  ["driver", "d", /^\d+(\.\d+)?$/],
  ["mult", "m", /^\d{1,3}$/],
  ["wheels", "w", /^\d{1,2}$/],
  ["gearMin", "g0", /^\d{1,4}$/],
  ["gearMax", "g1", /^\d{1,4}$/],
];

export function encodeState(s: PanelState): string {
  const params = new URLSearchParams();
  for (const [field, key, shape] of KEYS) {
    const value = s[field];
    if (value !== undefined && shape.test(value)) params.set(key, value);
  }
  return params.toString();
}

export function decodeState(hash: string): Partial<PanelState> {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const out: Partial<PanelState> = {};
  for (const [field, key, shape] of KEYS) {
    const value = params.get(key);
    if (value !== null && shape.test(value)) out[field] = value;
  }
  return out;
}
