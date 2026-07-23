import { describe, it, expect } from "vitest";
import { encodeState, decodeState, type PanelState } from "./urlState.js";

describe("url state", () => {
  const full: PanelState = {
    target: "approx:synodic-month", period: "29.530589", precision: "6",
    driver: "1", mult: "2", wheels: "4", gearMin: "6", gearMax: "120",
  };

  it("round-trips a full state", () => {
    expect(decodeState(encodeState(full))).toEqual(full);
  });

  it("round-trips with or without a leading #", () => {
    expect(decodeState("#" + encodeState(full))).toEqual(full);
  });

  it("round-trips an exact preset without custom fields", () => {
    const s: PanelState = {
      target: "exact:motion-works", driver: "1", mult: "1",
      wheels: "2", gearMin: "6", gearMax: "120",
    };
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it("drops values that fail the shape checks instead of applying them", () => {
    expect(decodeState("t=<script>alert(1)</script>&d=abc&m=-3&w=99999&g0=6")).toEqual({
      gearMin: "6",
    });
  });

  it("round-trips the custom-ratio and going-train targets", () => {
    const ratio: PanelState = {
      target: "custom-ratio", num: "235", den: "19",
      driver: "1", mult: "1", wheels: "4", gearMin: "6", gearMax: "120",
    };
    expect(decodeState(encodeState(ratio))).toEqual(ratio);
    const going: PanelState = {
      target: "going-train", bph: "18000", escape: "15",
      driver: "1", mult: "1", wheels: "4", gearMin: "6", gearMax: "120",
    };
    expect(decodeState(encodeState(going))).toEqual(going);
  });

  it("returns an empty object for an empty or absent fragment", () => {
    expect(decodeState("")).toEqual({});
    expect(decodeState("#")).toEqual({});
  });
});
