import type { Block, Connection, ExecutionResult, RuntimeValue } from "../types";

function topologicalSort(blocks: Record<string, Block>, connections: Connection[]): { order: string[] } | { error: string } {
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const allIds = Object.keys(blocks);
  for (const id of allIds) {
    adj[id] = [];
    inDegree[id] = 0;
  }
  for (const conn of connections) {
    if (!blocks[conn.sourceBlockId] || !blocks[conn.targetBlockId]) continue;
    adj[conn.sourceBlockId].push(conn.targetBlockId);
    inDegree[conn.targetBlockId] = (inDegree[conn.targetBlockId] ?? 0) + 1;
  }
  const queue: string[] = [];
  for (const id of allIds) {
    if (inDegree[id] === 0) queue.push(id);
  }
  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const neighbor of adj[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  if (order.length !== allIds.length) {
    return { error: "Circular dependency detected" };
  }
  return { order };
}

function getReachableSubgraph(
  connections: Connection[],
  triggerBlockId: string,
): Set<string> {
  const visited = new Set<string>();
  const queue = [triggerBlockId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const conn of connections) {
      if (conn.sourceBlockId === id) {
        queue.push(conn.targetBlockId);
      }
    }
  }
  return visited;
}

function getInputsForBlock(
  blockId: string,
  blocks: Record<string, Block>,
  connections: Connection[],
  results: Record<string, ExecutionResult>,
  existingResults?: Record<string, ExecutionResult>,
): Record<string, RuntimeValue> {
  const inputs: Record<string, RuntimeValue> = {};
  const block = blocks[blockId];
  if (!block) return inputs;
  for (const conn of connections) {
    if (conn.targetBlockId !== blockId) continue;
    const srcResult = results[conn.sourceBlockId] ?? existingResults?.[conn.sourceBlockId];
    if (srcResult?.status === "success") {
      inputs[conn.targetPortId] = srcResult.outputs[conn.sourcePortId] ?? null;
    }
  }
  return inputs;
}

function strToNum(s: string | undefined): number {
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function executeMath(block: Block, inputs: Record<string, RuntimeValue>): ExecutionResult {
  const op = block.ui_json.props.operation ?? "add";
  const a = typeof inputs.a === "number" ? inputs.a : strToNum(inputs.a as string) ?? 0;
  const b = typeof inputs.b === "number" ? inputs.b : strToNum(inputs.b as string) ?? 0;
  let result: number;
  switch (op) {
    case "subtract": result = a - b; break;
    case "multiply": result = a * b; break;
    case "divide": result = b === 0 ? 0 : a / b; break;
    default: result = a + b;
  }
  return { outputs: { result }, status: "success", timestamp: Date.now() };
}

function executeFilter(block: Block, inputs: Record<string, RuntimeValue>): ExecutionResult {
  void inputs;
  const condition = block.ui_json.props.condition ?? "true";
  const val = inputs.value;
  let passed = true;
  if (condition === "truthy") {
    passed = val !== null && val !== undefined && val !== false && val !== 0 && val !== "";
  } else if (condition === "falsy") {
    passed = !val;
  }
  return {
    outputs: { passed: passed ? val : null, failed: passed ? null : val },
    status: "success",
    timestamp: Date.now(),
  };
}

function executeMerge(block: Block, inputs: Record<string, RuntimeValue>): ExecutionResult {
  void block;
  const merged = [inputs.a, inputs.b].filter((v) => v !== null && v !== undefined);
  return {
    outputs: { merged: merged.length > 1 ? JSON.stringify(merged) : merged[0] ?? null },
    status: "success",
    timestamp: Date.now(),
  };
}

function executeSwitch(block: Block, inputs: Record<string, RuntimeValue>): ExecutionResult {
  const cases = (block.ui_json.props.cases ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const val = inputs.value;
  const valStr = String(val);
  if (cases.includes(valStr)) {
    return { outputs: { matched: val, default: null }, status: "success", timestamp: Date.now() };
  }
  return { outputs: { matched: null, default: val }, status: "success", timestamp: Date.now() };
}

function executeTemplate(block: Block, inputs: Record<string, RuntimeValue>): ExecutionResult {
  void block;
  const text = typeof inputs.text === "string" ? inputs.text : "";
  if (!text) {
    return { outputs: { result: "" }, status: "success", timestamp: Date.now() };
  }
  const vars: Record<string, unknown> = typeof inputs.vars === "string" ? JSON.parse(inputs.vars) : (inputs.vars ?? {}) as unknown as Record<string, unknown>;
  let out: string = text;
  if (typeof vars === "object" && vars !== null) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return { outputs: { result: out }, status: "success", timestamp: Date.now() };
}

function executeHttp(block: Block, inputs: Record<string, RuntimeValue>): ExecutionResult {
  void block;
  void inputs;
  return {
    outputs: {},
    status: "error",
    error: "HTTP blocks require a server runtime — not yet supported in-canvas",
    timestamp: Date.now(),
  };
}

function executeBlock(block: Block, inputs: Record<string, RuntimeValue>): ExecutionResult {
  const type = block.ui_json.type;
  switch (type) {
    case "math": return executeMath(block, inputs);
    case "filter": return executeFilter(block, inputs);
    case "merge": return executeMerge(block, inputs);
    case "switch": return executeSwitch(block, inputs);
    case "template": return executeTemplate(block, inputs);
    case "http": return executeHttp(block, inputs);
    default: {
      return {
        outputs: inputs,
        status: "success",
        timestamp: Date.now(),
      };
    }
  }
}

export function executeGraph(
  blocks: Record<string, Block>,
  connections: Connection[],
  triggerBlockId?: string,
  existingResults?: Record<string, ExecutionResult>,
): { results: Record<string, ExecutionResult> } | { error: string } {
  const sorted = topologicalSort(blocks, connections);
  if ("error" in sorted) return sorted;

  const results: Record<string, ExecutionResult> = {};
  const reachable = triggerBlockId ? getReachableSubgraph(connections, triggerBlockId) : null;

  for (const id of sorted.order) {
    if (reachable && !reachable.has(id)) {
      if (existingResults?.[id]) {
        results[id] = existingResults[id];
      }
      continue;
    }
    const block = blocks[id];
    if (!block) continue;
    const inputs = getInputsForBlock(id, blocks, connections, results, existingResults);
    results[id] = executeBlock(block, inputs);
  }

  return { results };
}

export function getDataValueForConnection(
  conn: Connection,
  results: Record<string, ExecutionResult>,
): RuntimeValue {
  const result = results[conn.sourceBlockId];
  if (!result || result.status !== "success") return null;
  return result.outputs[conn.sourcePortId] ?? null;
}
