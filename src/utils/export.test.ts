import { describe, it, expect } from "vitest";
import {
  exportBlock,
  exportView,
  exportProject,
  exportCatalogEntries,
  parseImportedJson,
} from "./export";
import type { Block, CanvasView, CatalogEntry, UIJSON } from "../types";

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "b1",
    position: { x: 0, y: 0 },
    size: { w: 200, h: 160 },
    ui_json: { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 40 } },
    catalog_json: { node: "Button", children: [] },
    static_code: "<Button />",
    ...overrides,
  };
}

describe("exportBlock", () => {
  it("produces correct format and version", () => {
    const result = exportBlock(makeBlock());
    expect(result.format).toBe("codeblocks-block");
    expect(result.version).toBe(1);
    expect(result.block.id).toBe("b1");
  });
});

describe("exportView", () => {
  it("includes only blocks referenced by the view", () => {
    const b1 = makeBlock({ id: "b1" });
    const b2 = makeBlock({ id: "b2" });
    const view: CanvasView = { id: "v1", name: "Test", blockIds: ["b1"], createdAt: 0 };
    const result = exportView(view, { b1, b2 });
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].id).toBe("b1");
  });

  it("skips missing block ids", () => {
    const view: CanvasView = { id: "v1", name: "Test", blockIds: ["missing"], createdAt: 0 };
    const result = exportView(view, {});
    expect(result.blocks).toHaveLength(0);
  });
});

describe("exportProject", () => {
  it("includes all views, blocks, and catalog entries", () => {
    const b1 = makeBlock({ id: "b1" });
    const view: CanvasView = { id: "v1", name: "Test", blockIds: ["b1"], createdAt: 0 };
    const catalog: CatalogEntry[] = [{ id: "c1", name: "Card", tags: ["card"], ui: {} as UIJSON, createdAt: 0 }];
    const result = exportProject({ v1: view }, { b1 }, catalog);
    expect(result.views).toHaveLength(1);
    expect(result.blocks).toHaveLength(1);
    expect(result.catalogEntries).toHaveLength(1);
  });
});

describe("exportCatalogEntries", () => {
  it("produces codeblocks-catalog format", () => {
    const entries: CatalogEntry[] = [];
    const result = exportCatalogEntries(entries);
    expect(result.format).toBe("codeblocks-catalog");
    expect(result.version).toBe(1);
  });
});

describe("parseImportedJson", () => {
  it("parses a valid block export", () => {
    const data = exportBlock(makeBlock());
    const parsed = parseImportedJson(JSON.stringify(data));
    expect(parsed.format).toBe("codeblocks-block");
  });

  it("parses a valid project export", () => {
    const data = exportProject({}, {}, []);
    const parsed = parseImportedJson(JSON.stringify(data));
    expect(parsed.format).toBe("codeblocks-project");
  });

  it("parses a valid catalog export", () => {
    const data = exportCatalogEntries([]);
    const parsed = parseImportedJson(JSON.stringify(data));
    expect(parsed.format).toBe("codeblocks-catalog");
  });

  it("throws on missing format field", () => {
    expect(() => parseImportedJson(JSON.stringify({}))).toThrow("missing 'format'");
  });

  it("throws on unknown format", () => {
    expect(() => parseImportedJson(JSON.stringify({ format: "unknown" }))).toThrow("Unknown export format");
  });

  it("throws on unsupported version", () => {
    expect(() => parseImportedJson(JSON.stringify({ format: "codeblocks-block", version: 99 }))).toThrow("Unsupported version");
  });
});
