import { describe, it, expect } from "vitest";
import { bezierPath, PORT_SPACING, HEADER_HEIGHT } from "../utils/connection";

describe("bezierPath", () => {
  it("returns an SVG path string starting with M", () => {
    const result = bezierPath(0, 0, 100, 100);
    expect(result.startsWith("M 0 0")).toBe(true);
    expect(result.includes("C")).toBe(true);
  });

  it("produces a cubic bezier curve", () => {
    const result = bezierPath(10, 20, 200, 50);
    expect(result).toContain("C ");
  });

  it("works for zero-length connections", () => {
    const result = bezierPath(50, 50, 50, 50);
    expect(result).toBeTruthy();
  });
});

describe("constants", () => {
  it("PORT_SPACING is 24", () => {
    expect(PORT_SPACING).toBe(24);
  });

  it("HEADER_HEIGHT is 44", () => {
    expect(HEADER_HEIGHT).toBe(44);
  });
});
