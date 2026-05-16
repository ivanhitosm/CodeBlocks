import { describe, it, expect } from "vitest";
import { deriveCatalog } from "./deriveCatalog";
import type { UIJSON } from "../types";

describe("deriveCatalog", () => {
  it("produces a node with capitalised type", () => {
    const ui: UIJSON = { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 40 } };
    const cat = deriveCatalog(ui);
    expect(cat.node).toBe("Button");
  });

  it("includes title prop as a child Text node", () => {
    const ui: UIJSON = { type: "card", props: { title: "Hello" }, layout: { x: 0, y: 0, w: 200, h: 160 } };
    const cat = deriveCatalog(ui);
    expect(cat.children?.some((c) => c.node === "Text" && c.props?.value === "Hello")).toBe(true);
  });

  it("includes description prop as a child Text node", () => {
    const ui: UIJSON = { type: "card", props: { description: "Desc" }, layout: { x: 0, y: 0, w: 200, h: 160 } };
    const cat = deriveCatalog(ui);
    expect(cat.children?.some((c) => c.node === "Text" && c.props?.value === "Desc")).toBe(true);
  });

  it("includes label prop as a child Text node", () => {
    const ui: UIJSON = { type: "input", props: { label: "Name" }, layout: { x: 0, y: 0, w: 200, h: 40 } };
    const cat = deriveCatalog(ui);
    expect(cat.children?.some((c) => c.node === "Text" && c.props?.value === "Name")).toBe(true);
  });

  it("always includes a Layout child node", () => {
    const ui: UIJSON = { type: "button", props: {}, layout: { x: 0, y: 0, w: 120, h: 36 } };
    const cat = deriveCatalog(ui);
    const layoutChild = cat.children?.find((c) => c.node === "Layout");
    expect(layoutChild).toBeDefined();
    expect(layoutChild?.props?.w).toBe(120);
    expect(layoutChild?.props?.h).toBe(36);
  });

  it("recurses into children", () => {
    const ui: UIJSON = {
      type: "layout",
      props: { label: "Container" },
      layout: { x: 0, y: 0, w: 400, h: 200 },
      children: [
        { type: "button", props: { label: "OK" }, layout: { x: 0, y: 0, w: 80, h: 36 } },
        { type: "input", props: { placeholder: "text" }, layout: { x: 0, y: 40, w: 200, h: 40 } },
      ],
    };
    const cat = deriveCatalog(ui);
    expect(cat.node).toBe("Layout");
    const buttonChild = cat.children?.find((c) => c.node === "Button");
    expect(buttonChild).toBeDefined();
    const inputChild = cat.children?.find((c) => c.node === "Input");
    expect(inputChild).toBeDefined();
  });

  it("uses default layout values when layout is missing", () => {
    const ui: UIJSON = { type: "text", props: {} } as UIJSON;
    const cat = deriveCatalog(ui);
    const layoutChild = cat.children?.find((c) => c.node === "Layout");
    expect(layoutChild?.props?.w).toBe(200);
    expect(layoutChild?.props?.h).toBe(160);
  });
});
