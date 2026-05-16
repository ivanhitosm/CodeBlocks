import { describe, it, expect } from "vitest";
import { deriveCode } from "./deriveCode";
import type { UIJSON } from "../types";

describe("deriveCode", () => {
  it("wraps output in a Block function component", () => {
    const ui: UIJSON = { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 40 } };
    const code = deriveCode(ui);
    expect(code).toContain("export default function Block()");
  });

  it("renders a self-closing element for leaf nodes", () => {
    const ui: UIJSON = { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 40 } };
    const code = deriveCode(ui);
    expect(code).toContain("<Button />");
  });

  it("includes props on elements", () => {
    const ui: UIJSON = { type: "input", props: { label: "Name", placeholder: "Enter name" }, layout: { x: 0, y: 0, w: 200, h: 40 } };
    const code = deriveCode(ui);
    expect(code).toContain('label="Name"');
    expect(code).toContain('placeholder="Enter name"');
  });

  it("renders children as nested elements", () => {
    const ui: UIJSON = {
      type: "layout",
      props: {},
      layout: { x: 0, y: 0, w: 400, h: 200 },
      children: [
        { type: "button", props: { label: "OK" }, layout: { x: 0, y: 0, w: 80, h: 36 } },
      ],
    };
    const code = deriveCode(ui);
    expect(code).toContain("<Layout>");
    expect(code).toContain("<Button");
    expect(code).toContain("</Layout>");
  });

  it("filters out undefined props", () => {
    const ui: UIJSON = { type: "button", props: { label: "Click", description: undefined }, layout: { x: 0, y: 0, w: 100, h: 40 } };
    const code = deriveCode(ui);
    expect(code).toContain('label="Click"');
    expect(code).not.toContain("description");
  });

  it("indents nested children", () => {
    const ui: UIJSON = {
      type: "layout",
      props: {},
      layout: { x: 0, y: 0, w: 400, h: 200 },
      children: [
        { type: "button", props: { label: "OK" }, layout: { x: 0, y: 0, w: 80, h: 36 } },
      ],
    };
    const code = deriveCode(ui);
    const lines = code.split("\n");
    const buttonLine = lines.find((l) => l.includes("<Button"));
    expect(buttonLine).toMatch(/^ {6}/);
  });
});
