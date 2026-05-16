import { describe, it, expect } from "vitest";
import { str } from "./str";

describe("str", () => {
  it("returns the string value unchanged", () => {
    expect(str("hello")).toBe("hello");
  });

  it("returns fallback for null", () => {
    expect(str(null)).toBe("");
  });

  it("returns fallback for undefined", () => {
    expect(str(undefined)).toBe("");
  });

  it("returns custom fallback for null", () => {
    expect(str(null, "nope")).toBe("nope");
  });

  it("converts numbers to string", () => {
    expect(str(42)).toBe("42");
  });

  it("converts zero to string", () => {
    expect(str(0)).toBe("0");
  });

  it("converts boolean true to string", () => {
    expect(str(true)).toBe("true");
  });

  it("converts boolean false to string", () => {
    expect(str(false)).toBe("false");
  });

  it("returns fallback for objects", () => {
    expect(str({}, "fallback")).toBe("fallback");
  });

  it("returns fallback for arrays", () => {
    expect(str([])).toBe("");
  });

  it("handles empty string", () => {
    expect(str("")).toBe("");
  });
});
