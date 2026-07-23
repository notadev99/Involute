import { describe, it, expect } from "vitest";
import { mountApp } from "./app.js";

describe("app", () => {
  it("mounts, solves a default target, and renders rows + a schematic", () => {
    const root = document.createElement("main");
    mountApp(root);
    expect(root.querySelector(".input-panel")).not.toBeNull();
    expect(root.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
    expect(root.querySelector("svg.schematic")).not.toBeNull();
    // solving writes the shareable state into the fragment
    expect(location.hash).toContain("t=approx%3Asynodic-month");
    history.replaceState(null, "", "#");
  });

  it("shows a readable notice for malformed input instead of throwing", () => {
    const root = document.createElement("main");
    mountApp(root);
    const select = root.querySelector<HTMLSelectElement>("#preset-select")!;
    select.value = "custom";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    const period = root.querySelector<HTMLInputElement>("#custom-period")!;
    period.value = "29,5";
    period.dispatchEvent(new Event("input", { bubbles: true }));
    const notice = root.querySelector(".input-error")!;
    expect(notice).not.toBeNull();
    expect(notice.textContent).toContain("decimal point");
    // recovery: a valid value solves again and clears the notice
    period.value = "29.530589";
    period.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector(".input-error")).toBeNull();
    expect(root.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
    history.replaceState(null, "", "#");
  });

  it("seeds the multiplicity field from the preset default on switch", () => {
    const root = document.createElement("main");
    mountApp(root);
    const mult = root.querySelector<HTMLInputElement>("#multiplicity")!;
    expect(mult.value).toBe("2"); // synodic-month default: double-moon disc
    const select = root.querySelector<HTMLSelectElement>("#preset-select")!;
    select.value = "approx:tropical-year";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(mult.value).toBe("1");
    history.replaceState(null, "", "#");
  });

  it("restores panel state from a shared link and solves it", () => {
    history.replaceState(null, "", "#t=exact%3Amotion-works&w=2&g0=6&g1=80");
    const root = document.createElement("main");
    mountApp(root);
    const select = root.querySelector<HTMLSelectElement>("#preset-select")!;
    expect(select.value).toBe("exact:motion-works");
    expect(root.querySelector<HTMLInputElement>("#max-wheels")!.value).toBe("2");
    expect(root.querySelector<HTMLInputElement>("#gear-max")!.value).toBe("80");
    expect(root.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
    history.replaceState(null, "", "#");
  });
});
