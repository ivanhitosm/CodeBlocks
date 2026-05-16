import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useStore } from "./useStore";
import type { Block, UIJSON } from "../types";

function makeBlock(id: string, overrides: Partial<Block> = {}): Block {
  return {
    id,
    position: { x: 0, y: 0 },
    size: { w: 200, h: 160 },
    ui_json: { type: "button", props: {}, layout: { x: 0, y: 0, w: 100, h: 40 } },
    catalog_json: { node: "Button", children: [] },
    static_code: "<Button />",
    ...overrides,
  };
}

beforeEach(() => {
  act(() => {
    useStore.setState({
      blocks: {},
      views: { default: { id: "default", name: "Default", blockIds: [], createdAt: Date.now() } },
      activeViewId: "default",
      selectedBlockIds: [],
      selectedModel: "llama3.1:latest",
      catalogEntries: [],
      past: [],
      future: [],
    });
  });
});

describe("addBlock", () => {
  it("adds a block to the store and the active view", () => {
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    expect(useStore.getState().blocks.b1).toBeDefined();
    expect(useStore.getState().views.default.blockIds).toContain("b1");
  });

  it("does not add to a non-existent view", () => {
    act(() => useStore.setState({ activeViewId: "nonexistent" }));
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    expect(useStore.getState().blocks.b1).toBeDefined();
    expect(useStore.getState().views.default.blockIds).not.toContain("b1");
  });
});

describe("removeBlock", () => {
  it("removes a block and its id from all views", () => {
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    act(() => useStore.getState().removeBlock("b1"));
    expect(useStore.getState().blocks.b1).toBeUndefined();
    expect(useStore.getState().views.default.blockIds).not.toContain("b1");
  });
});

describe("updateBlock", () => {
  it("updates block fields", () => {
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    act(() => useStore.getState().updateBlock("b1", { position: { x: 100, y: 200 } }));
    expect(useStore.getState().blocks.b1.position).toEqual({ x: 100, y: 200 });
  });

  it("does nothing for non-existent block", () => {
    act(() => useStore.getState().updateBlock("missing", { position: { x: 10, y: 10 } }));
  });
});

describe("clearBlocks", () => {
  it("removes all blocks and clears view blockIds", () => {
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    act(() => useStore.getState().addBlock(makeBlock("b2")));
    act(() => useStore.getState().clearBlocks());
    expect(Object.keys(useStore.getState().blocks)).toHaveLength(0);
    expect(useStore.getState().views.default.blockIds).toHaveLength(0);
  });
});

describe("undo / redo", () => {
  it("undo restores previous state after addBlock", () => {
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    expect(useStore.getState().blocks.b1).toBeDefined();
    act(() => useStore.getState().undo());
    expect(useStore.getState().blocks.b1).toBeUndefined();
  });

  it("redo restores after undo", () => {
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    act(() => useStore.getState().undo());
    expect(useStore.getState().blocks.b1).toBeUndefined();
    act(() => useStore.getState().redo());
    expect(useStore.getState().blocks.b1).toBeDefined();
  });

  it("does nothing on empty undo", () => {
    act(() => useStore.getState().undo());
  });

  it("does nothing on empty redo", () => {
    act(() => useStore.getState().redo());
  });
});

describe("view operations", () => {
  it("creates a view and switches to it", () => {
    const id = useStore.getState().createView("Mobile");
    expect(id).toBeTruthy();
    expect(useStore.getState().activeViewId).toBe(id);
    expect(useStore.getState().views[id].name).toBe("Mobile");
  });

  it("renames a view", () => {
    const id = useStore.getState().createView("Old");
    act(() => useStore.getState().renameView(id, "New"));
    expect(useStore.getState().views[id].name).toBe("New");
  });

  it("duplicates a view including blockIds", () => {
    const original = useStore.getState().createView("Original");
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    act(() => useStore.getState().addBlock(makeBlock("b2")));
    act(() => useStore.getState().duplicateView(original));
    const dup = Object.values(useStore.getState().views).find((v) => v.name === "Original (copy)");
    expect(dup).toBeDefined();
    expect(dup!.blockIds).toEqual(useStore.getState().views[original].blockIds);
  });

  it("deletes a non-default view", () => {
    const id = useStore.getState().createView("Temp");
    act(() => useStore.getState().removeView(id));
    expect(useStore.getState().views[id]).toBeUndefined();
  });

  it("does not delete the default view", () => {
    act(() => useStore.getState().removeView("default"));
    expect(useStore.getState().views.default).toBeDefined();
  });
});

describe("setActiveView", () => {
  it("switches active view", () => {
    const id = useStore.getState().createView("Other");
    act(() => useStore.getState().setActiveView(id));
    expect(useStore.getState().activeViewId).toBe(id);
  });
});

describe("moveBlockToView", () => {
  it("moves a block from one view to another", () => {
    act(() => useStore.getState().addBlock(makeBlock("b1")));
    const v2 = useStore.getState().createView("V2");
    act(() => useStore.getState().moveBlockToView("b1", v2));
    expect(useStore.getState().views.default.blockIds).not.toContain("b1");
    expect(useStore.getState().views[v2].blockIds).toContain("b1");
  });
});

describe("setViewTarget", () => {
  it("sets target on a view", () => {
    act(() => useStore.getState().setViewTarget("default", "mobile"));
    expect(useStore.getState().views.default.target).toBe("mobile");
  });
});

describe("catalog operations", () => {
  it("adds a catalog entry", () => {
    const entry = { id: "c1", name: "Card", ui: {} as UIJSON, createdAt: Date.now() };
    act(() => useStore.getState().addCatalogEntry(entry));
    expect(useStore.getState().catalogEntries).toHaveLength(1);
  });

  it("removes a catalog entry", () => {
    const entry = { id: "c1", name: "Card", ui: {} as UIJSON, createdAt: Date.now() };
    act(() => useStore.getState().addCatalogEntry(entry));
    act(() => useStore.getState().removeCatalogEntry("c1"));
    expect(useStore.getState().catalogEntries).toHaveLength(0);
  });
});

describe("toggleSelection", () => {
  it("toggles block ids in selectedBlockIds", () => {
    act(() => useStore.getState().toggleSelection("b1"));
    expect(useStore.getState().selectedBlockIds).toContain("b1");
    act(() => useStore.getState().toggleSelection("b1"));
    expect(useStore.getState().selectedBlockIds).not.toContain("b1");
  });
});
