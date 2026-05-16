import { describe, it, expect } from "vitest";
import { parseAndValidate } from "./ollama";

describe("parseAndValidate", () => {
  it("parses a valid UIJSON from plain JSON", () => {
    const result = parseAndValidate('{"type":"button","props":{"label":"Click"},"layout":{"x":0,"y":0,"w":100,"h":40}}');
    expect(result.type).toBe("button");
    expect(result.props?.label).toBe("Click");
  });

  it("strips markdown code fences", () => {
    const input = "```json\n{\"type\":\"button\",\"props\":{},\"layout\":{\"x\":0,\"y\":0,\"w\":100,\"h\":40}}\n```";
    const result = parseAndValidate(input);
    expect(result.type).toBe("button");
  });

  it("extracts JSON from surrounding text", () => {
    const input = 'Here is your block: {"type":"button","props":{},"layout":{"x":0,"y":0,"w":100,"h":40}} Hope you like it!';
    const result = parseAndValidate(input);
    expect(result.type).toBe("button");
  });

  it("throws on missing JSON", () => {
    expect(() => parseAndValidate("no json here")).toThrow("No JSON object found");
  });

  it("throws on invalid type", () => {
    expect(() => parseAndValidate('{"type":"nonexistent","props":{},"layout":{"x":0,"y":0,"w":100,"h":40}}')).toThrow("Invalid UI type");
  });

  it("throws on nested props", () => {
    expect(() =>
      parseAndValidate('{"type":"button","props":{"items":["a","b"]},"layout":{"x":0,"y":0,"w":100,"h":40}}')
    ).toThrow("must be a string");
  });

  it("fills missing layout with defaults", () => {
    const result = parseAndValidate('{"type":"button","props":{}}');
    expect(result.layout).toBeDefined();
    expect(result.layout.x).toBe(0);
    expect(result.layout.y).toBe(0);
    expect(result.layout.w).toBe(200);
    expect(result.layout.h).toBe(160);
  });

  it("handles composite layout with children", () => {
    const input = JSON.stringify({
      type: "layout",
      props: { label: "Form" },
      layout: { x: 0, y: 0, w: 400, h: 300 },
      children: [
        { type: "input", props: { placeholder: "email" }, layout: { x: 0, y: 0, w: 280, h: 40 } },
        { type: "button", props: { label: "Submit" }, layout: { x: 0, y: 50, w: 280, h: 40 } },
      ],
    });
    const result = parseAndValidate(input);
    expect(result.type).toBe("layout");
    expect(result.children).toHaveLength(2);
    expect(result.children![0].type).toBe("input");
  });

  it("throws on nested props in children", () => {
    const input = JSON.stringify({
      type: "layout",
      props: {},
      layout: { x: 0, y: 0, w: 400, h: 300 },
      children: [
        { type: "button", props: { items: ["x"] }, layout: { x: 0, y: 0, w: 100, h: 40 } },
      ],
    });
    expect(() => parseAndValidate(input)).toThrow("must be a string");
  });

  it("accepts layout type", () => {
    const input = '{"type":"layout","props":{},"layout":{"x":0,"y":0,"w":400,"h":300}}';
    const result = parseAndValidate(input);
    expect(result.type).toBe("layout");
  });
});
