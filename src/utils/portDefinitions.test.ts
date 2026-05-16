import { describe, it, expect } from "vitest";
import { getPorts, canConnect, isLogicBlock } from "./portDefinitions";

describe("getPorts", () => {
  it("returns output ports for button", () => {
    const ports = getPorts("button");
    expect(ports.length).toBeGreaterThan(0);
    expect(ports.every((p) => p.direction === "output")).toBe(true);
    expect(ports.find((p) => p.id === "click")).toBeDefined();
  });

  it("returns input and output ports for math", () => {
    const ports = getPorts("math");
    const inputs = ports.filter((p) => p.direction === "input");
    const outputs = ports.filter((p) => p.direction === "output");
    expect(inputs.length).toBe(2);
    expect(outputs.length).toBe(1);
    expect(outputs[0].id).toBe("result");
  });

  it("returns input ports for text", () => {
    const ports = getPorts("text");
    expect(ports.length).toBe(1);
    expect(ports[0].direction).toBe("input");
    expect(ports[0].id).toBe("value");
  });

  it("returns empty array for unknown types", () => {
    expect(getPorts("nonexistent")).toEqual([]);
  });

  it("returns ports for all logic block types", () => {
    for (const type of ["math", "filter", "merge", "switch", "template", "http"]) {
      expect(getPorts(type).length).toBeGreaterThan(0);
    }
  });
});

describe("getPorts with layout children", () => {
  it("returns empty array for layout with no children", () => {
    expect(getPorts("layout")).toEqual([]);
  });

  it("aggregates children output ports for layout", () => {
    const children = [
      { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 50 } },
    ];
    const ports = getPorts("layout", children);
    expect(ports.length).toBe(1);
    expect(ports[0].id).toBe("c0-click");
    expect(ports[0].label).toBe("button Click");
    expect(ports[0].direction).toBe("output");
  });

  it("aggregates children input ports for layout", () => {
    const children = [
      { type: "text", props: {}, layout: { x: 0, y: 0, w: 100, h: 50 } },
    ];
    const ports = getPorts("layout", children);
    expect(ports.length).toBe(1);
    expect(ports[0].id).toBe("c0-value");
    expect(ports[0].direction).toBe("input");
  });

  it("aggregates all ports from multiple children", () => {
    const children = [
      { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 50 } },
      { type: "input", props: {}, layout: { x: 0, y: 100, w: 100, h: 50 } },
    ];
    const ports = getPorts("layout", children);
    const ids = ports.map((p) => p.id).sort();
    expect(ids).toEqual(["c0-click", "c1-change", "c1-value"]);
  });

  it("includes all ports from multiple similar children", () => {
    const children = [
      { type: "input", props: {}, layout: { x: 0, y: 0, w: 100, h: 50 } },
      { type: "select", props: {}, layout: { x: 0, y: 100, w: 100, h: 50 } },
    ];
    const ports = getPorts("layout", children);
    expect(ports.length).toBe(4);
    const ids = ports.map((p) => p.id).sort();
    expect(ids).toEqual(["c0-change", "c0-value", "c1-change", "c1-value"]);
  });

  it("ignores non-layout types with children", () => {
    const children = [
      { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 50 } },
    ];
    const ports = getPorts("button", children);
    expect(ports.length).toBe(1);
    expect(ports[0].id).toBe("click");
  });
});

describe("canConnect", () => {
  it("allows same type connection", () => {
    expect(canConnect("number", "number")).toBe(true);
    expect(canConnect("string", "string")).toBe(true);
  });

  it("rejects different type connection", () => {
    expect(canConnect("number", "string")).toBe(false);
    expect(canConnect("event", "string")).toBe(false);
  });

  it("allows any type to connect to anything", () => {
    expect(canConnect("any", "string")).toBe(true);
    expect(canConnect("number", "any")).toBe(true);
    expect(canConnect("any", "any")).toBe(true);
  });
});

describe("isLogicBlock", () => {
  it("returns true for logic block types", () => {
    expect(isLogicBlock("math")).toBe(true);
    expect(isLogicBlock("filter")).toBe(true);
    expect(isLogicBlock("merge")).toBe(true);
    expect(isLogicBlock("switch")).toBe(true);
    expect(isLogicBlock("template")).toBe(true);
    expect(isLogicBlock("http")).toBe(true);
  });

  it("returns false for UI block types", () => {
    expect(isLogicBlock("button")).toBe(false);
    expect(isLogicBlock("card")).toBe(false);
    expect(isLogicBlock("text")).toBe(false);
    expect(isLogicBlock("input")).toBe(false);
  });

  it("returns false for unknown types", () => {
    expect(isLogicBlock("nonexistent")).toBe(false);
  });
});
