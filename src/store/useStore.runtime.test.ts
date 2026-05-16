import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useStore } from "./useStore";
import type { Block, Connection } from "../types";

function makeBlock(id: string, type: string, props: Record<string, string> = {}): Block {
  return {
    id,
    position: { x: 0, y: 0 },
    size: { w: 200, h: 100 },
    ui_json: { type, props, layout: { x: 0, y: 0, w: 200, h: 100 } },
    catalog_json: { node: type },
    static_code: "",
  };
}

function makeConnection(
  id: string,
  sourceBlockId: string,
  targetBlockId: string,
  sourcePortId = "result",
  targetPortId = "a",
): Connection {
  return { id, sourceBlockId, sourcePortId, targetBlockId, targetPortId };
}

beforeEach(() => {
  act(() =>
    useStore.setState({
      blocks: {},
      connections: [],
      runtimeResults: {},
      isExecuting: false,
    })
  );
});

describe("triggerExecution", () => {
  it("executes a single math block and stores results", () => {
    act(() => {
      useStore.getState().addBlock(makeBlock("m1", "math", { operation: "add" }));
    });
    act(() => {
      useStore.getState().triggerExecution();
    });
    const state = useStore.getState();
    expect(state.isExecuting).toBe(false);
    expect(state.runtimeResults.m1).toBeDefined();
    expect(state.runtimeResults.m1.status).toBe("success");
  });

  it("propagates data through connections", () => {
    act(() => {
      const source = makeBlock("src", "math", { operation: "add" });
      const target = makeBlock("tgt", "math", { operation: "add" });
      useStore.getState().addBlock(source);
      useStore.getState().addBlock(target);
    });
    act(() => {
      useStore.getState().addConnection(makeConnection("c1", "src", "tgt"));
    });
    act(() => {
      useStore.getState().triggerExecution();
    });
    const state = useStore.getState();
    expect(state.runtimeResults.src?.status).toBe("success");
    expect(state.runtimeResults.tgt?.status).toBe("success");
  });

  it("handles cycle detection gracefully", () => {
    act(() => {
      useStore.getState().addBlock(makeBlock("a", "math"));
      useStore.getState().addBlock(makeBlock("b", "math"));
    });
    act(() => {
      useStore.getState().addConnection(makeConnection("c1", "a", "b"));
      useStore.getState().addConnection(makeConnection("c2", "b", "a"));
    });
    act(() => {
      useStore.getState().triggerExecution();
    });
    const state = useStore.getState();
    expect(state.isExecuting).toBe(false);
  });

  it("only executes from trigger block when specified", () => {
    act(() => {
      useStore.getState().addBlock(makeBlock("a", "math"));
      useStore.getState().addBlock(makeBlock("b", "math"));
    });
    act(() => {
      useStore.getState().triggerExecution("b");
    });
    const state = useStore.getState();
    expect(state.runtimeResults.a).toBeUndefined();
    expect(state.runtimeResults.b).toBeDefined();
  });

  it("scoped execution preserves unrelated block results via existingResults", () => {
    act(() => {
      useStore.getState().addBlock(makeBlock("x", "math"));
      useStore.getState().addBlock(makeBlock("y", "math"));
      useStore.getState().addBlock(makeBlock("z", "math"));
    });
    act(() => {
      useStore.getState().setRuntimeResults({
        x: { outputs: { result: 1 }, status: "success", timestamp: 1 },
        z: { outputs: { result: 3 }, status: "success", timestamp: 1 },
      });
    });
    act(() => {
      useStore.getState().triggerExecution("y");
    });
    const state = useStore.getState();
    expect(state.runtimeResults.x).toBeDefined();
    expect(state.runtimeResults.y).toBeDefined();
    expect(state.runtimeResults.z).toBeDefined();
  });
});

describe("setRuntimeResults", () => {
  it("sets results and clears executing flag", () => {
    act(() =>
      useStore.setState({ isExecuting: true })
    );
    const results = { b1: { outputs: { result: 42 }, status: "success" as const, timestamp: 1 } };
    act(() => {
      useStore.getState().setRuntimeResults(results);
    });
    const state = useStore.getState();
    expect(state.runtimeResults).toEqual(results);
    expect(state.isExecuting).toBe(false);
  });
});
