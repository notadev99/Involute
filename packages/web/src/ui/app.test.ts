import { describe, it, expect } from "vitest";
import { mountApp } from "./app.js";

describe("app", () => {
  it("mounts, solves a default target, and renders rows + a schematic", () => {
    const root = document.createElement("main");
    mountApp(root);
    expect(root.querySelector(".input-panel")).not.toBeNull();
    expect(root.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
    expect(root.querySelector("svg.schematic")).not.toBeNull();
  });
});
