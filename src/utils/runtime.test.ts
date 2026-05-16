import { describe, it, expect } from "vitest";
import { executeGraph, getDataValueForConnection } from "./runtime";
import type { Block, Connection, ExecutionResult } from "../types";

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

describe("executeGraph", () => {
  it("returns empty results for empty blocks", () => {
    const result = executeGraph({}, []);
    expect(result).toEqual({ results: {} });
  });

  it("returns results for a single block", () => {
    const blocks = { a: makeBlock("a", "math", { operation: "add" }) };
    const result = executeGraph(blocks, []);
    if ("error" in result) throw new Error(result.error);
    expect(result.results.a).toBeDefined();
    expect(result.results.a.status).toBe("success");
  });

  it("detects circular dependencies", () => {
    const blocks = {
      a: makeBlock("a", "math"),
      b: makeBlock("b", "math"),
    };
    const connections = [
      makeConnection("c1", "a", "b", "result", "a"),
      makeConnection("c2", "b", "a", "result", "b"),
    ];
    const result = executeGraph(blocks, connections);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Circular dependency detected");
    }
  });

  it("executes math add correctly", () => {
    const blocks = {
      a: makeBlock("a", "math", { operation: "add" }),
    };
    const connections: Connection[] = [];
    const result = executeGraph(blocks, connections);
    if ("error" in result) throw new Error(result.error);
    expect(result.results.a.outputs.result).toBe(0);
  });

  it("executes math subtract with propagated inputs", () => {
    const blocks = {
      source: makeBlock("source", "math", { operation: "add" }),
      target: makeBlock("target", "math", { operation: "subtract" }),
    };
    const connections = [
      makeConnection("c1", "source", "target", "result", "a"),
    ];
    const result = executeGraph(blocks, connections);
    if ("error" in result) throw new Error(result.error);
    expect(result.results.target.status).toBe("success");
  });

  it("passes data through connections", () => {
    const blocks = {
      source: makeBlock("source", "math", { operation: "add" }),
      target: makeBlock("target", "math", { operation: "add" }),
    };
    const connections = [
      makeConnection("c1", "source", "target", "result", "a"),
    ];
    const result = executeGraph(blocks, connections);
    if ("error" in result) throw new Error(result.error);
    expect(result.results.target.status).toBe("success");
  });

  it("executes only from trigger block when specified", () => {
    const blocks = {
      a: makeBlock("a", "math"),
      b: makeBlock("b", "math"),
    };
    const result = executeGraph(blocks, [], "b");
    if ("error" in result) throw new Error(result.error);
    expect(result.results.a).toBeUndefined();
    expect(result.results.b).toBeDefined();
  });
});

describe("getDataValueForConnection", () => {
  it("returns null when no results exist", () => {
    const conn = makeConnection("c", "a", "b", "result", "a");
    expect(getDataValueForConnection(conn, {})).toBeNull();
  });

  it("returns the output value from source block", () => {
    const conn = makeConnection("c", "a", "b", "result", "a");
    const results: Record<string, ExecutionResult> = {
      a: { outputs: { result: 42 }, status: "success", timestamp: 0 },
    };
    expect(getDataValueForConnection(conn, results)).toBe(42);
  });

  it("returns null when source block has error", () => {
    const conn = makeConnection("c", "a", "b", "result", "a");
    const results: Record<string, ExecutionResult> = {
      a: { outputs: {}, status: "error", error: "fail", timestamp: 0 },
    };
    expect(getDataValueForConnection(conn, results)).toBeNull();
  });
});

describe("scoped execution with existingResults", () => {
  it("uses existing result as input fallback when upstream block is not re-executed", () => {
    const blocks = {
      upstream: makeBlock("upstream", "math", { operation: "add" }),
      downstream: makeBlock("downstream", "math", { operation: "add" }),
    };
    const connections = [
      makeConnection("c", "upstream", "downstream"),
    ];
    const existing: Record<string, ExecutionResult> = {
      upstream: { outputs: { result: 10 }, status: "success", timestamp: 1 },
    };
    const result = executeGraph(blocks, connections, "downstream", existing);
    if ("error" in result) throw new Error(result.error);
    expect(result.results.downstream).toBeDefined();
    expect(result.results.downstream.status).toBe("success");
  });

  it("preserves existing results for unrelated blocks outside subgraph", () => {
    const blocks = {
      a: makeBlock("a", "math"),
      b: makeBlock("b", "math"),
      c: makeBlock("c", "math"),
    };
    const connections = [
      makeConnection("c1", "a", "b"),
    ];
    const existing: Record<string, ExecutionResult> = {
      c: { outputs: { result: 99 }, status: "success", timestamp: 1 },
    };
    const result = executeGraph(blocks, connections, "a", existing);
    if ("error" in result) throw new Error(result.error);
    expect(result.results.c).toEqual(existing.c);
    expect(result.results.a).toBeDefined();
    expect(result.results.b).toBeDefined();
  });
});
