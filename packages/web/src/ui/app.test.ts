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
    // the what-was-solved line and provenance are on screen
    expect(root.querySelector(".solve-summary")!.textContent).toContain("source: Meeus");
    expect(root.querySelector(".target-note")!.textContent).toContain("Meeus");
    // achieved period rendered per row in approx mode
    expect(root.querySelector("thead")!.textContent).toContain("Achieved period");
    expect(root.querySelector("td.period")!.textContent).toMatch(/^\d+\.\d{6}$/);
    history.replaceState(null, "", "#");
  });

  it("teaches the cold visitor: intro, grouped controls, reading guide, share", () => {
    const root = document.createElement("main");
    mountApp(root);
    // intro band frames the auto-solved example
    expect(root.querySelector(".intro")!.textContent).toMatch(/live example/i);
    // controls are grouped into two labelled fieldsets
    const legends = [...root.querySelectorAll("fieldset.field-group > legend")].map((l) => l.textContent);
    expect(legends).toEqual(["What to solve", "Constraints"]);
    // the recommended row carries a visible "best" badge, not colour alone
    const badge = root.querySelector('tr[data-best="true"] .best-badge')!;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe("best");
    // a plain-language reading guide sits under the table
    expect(root.querySelector(".results-legend")!.textContent).toMatch(/each row is one gear train/i);
    // the schematic is captioned once a result exists
    expect(root.querySelector<HTMLElement>(".schematic-caption")!.hidden).toBe(false);
    // a Copy link button shares the pre-solved permalink
    const link = root.querySelector<HTMLButtonElement>('[data-export="link"]')!;
    expect(link).not.toBeNull();
    link.click(); // must not throw even where clipboard is unavailable
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

  it("solves a custom exact ratio", () => {
    const root = document.createElement("main");
    mountApp(root);
    const select = root.querySelector<HTMLSelectElement>("#preset-select")!;
    select.value = "custom-ratio";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    const num = root.querySelector<HTMLInputElement>("#ratio-num")!;
    num.value = "235";
    root.querySelector<HTMLInputElement>("#ratio-den")!.value = "19";
    num.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector(".input-error")).toBeNull();
    expect(root.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
    history.replaceState(null, "", "#");
  });

  it("solves a going train from beat rate and escape teeth", () => {
    const root = document.createElement("main");
    mountApp(root);
    const select = root.querySelector<HTMLSelectElement>("#preset-select")!;
    select.value = "going-train";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    // defaults: 18000 bph, 15 escape teeth
    expect(root.querySelector(".input-error")).toBeNull();
    expect(root.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
    expect(location.hash).toContain("t=going-train");
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
