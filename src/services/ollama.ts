import { COMPONENTS } from "../registry";
import type { CatalogEntry, UIJSON } from "../types";

const OLLAMA_HOST = "http://localhost:11434";

export type OllamaModel = {
  name: string;
  modified_at: string;
  size: number;
};

export async function fetchModels(): Promise<OllamaModel[]> {
  const res = await fetch(`${OLLAMA_HOST}/api/tags`);
  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
  const data = await res.json();
  return (data.models ?? []).map((m: { name: string; modified_at: string; size: number }) => ({
    name: m.name,
    modified_at: m.modified_at,
    size: m.size,
  }));
}

function buildSystemPrompt(prompt: string, catalogContext?: CatalogEntry[]): string {
  const typeList = COMPONENTS.map((c) => c.type).join(", ");
  const propHints = COMPONENTS.filter((c) => !c.composite).map(
    (c) => `- For ${c.type}: props can include ${c.propNames.join(", ")}`
  ).join("\n");

  return [
    "You generate UI JSON blocks.",
    "RULES:",
    "- Output ONLY valid JSON",
    "- No markdown",
    "- No explanation",
    '- Must match schema: { "type": string, "props": Record<string,string>, "layout": { "x": 0, "y": 0, "w": number, "h": number }, "children"?: UIJSON[] }',
    `- type must be one of: ${typeList}`,
    "- CRITICAL: props values must be FLAT STRINGS ONLY. NEVER nest objects or arrays inside props.",
    "- BAD (do not do this — nested arrays/objects inside props):",
    '  { "type": "card", "props": { "title": "Login", "items": [{ "type": "input" }] } }',
    "- GOOD (do this instead for multi-component blocks):",
    '  { "type": "layout", "props": { "label": "Login Form" }, "children": [',
    '    { "type": "input", "props": { "label": "Email", "placeholder": "enter email" }, "layout": { "x": 0, "y": 0, "w": 280, "h": 40 } },',
    '    { "type": "input", "props": { "label": "Password", "placeholder": "enter password" }, "layout": { "x": 0, "y": 50, "w": 280, "h": 40 } },',
    '    { "type": "button", "props": { "label": "Submit" }, "layout": { "x": 0, "y": 100, "w": 280, "h": 40 } }',
    "  ] }",
    propHints,
    "- For layout: type is 'layout', props can include label. Use it as a container with a children array.",
    '- When using "layout" type, include a "children" array where each child is a valid UIJSON block.',
    "- Children should be arranged vertically and fit within the parent layout dimensions.",
    "- layout.w and layout.h should be reasonable (200-600)",
    "INPUT:",
    "Existing UI (null for new block)",
    `USER REQUEST: ${prompt}`,
    catalogContext && catalogContext.length > 0
      ? "AVAILABLE REUSABLE COMPONENTS:\n" +
        catalogContext
          .slice(0, 10)
          .map(
            (e) =>
              `- ${e.name}${e.composite ? " (composite)" : ""}` +
              `${e.description ? `: ${e.description}` : ""}` +
              `${e.tags && e.tags.length > 0 ? ` [tags: ${e.tags.join(", ")}]` : ""}`
          )
          .join("\n")
      : "",
  ].join("\n");
}

export function parseAndValidate(text: string): UIJSON {
  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in LLM response");
  }
  const cleaned = stripped.slice(firstBrace, lastBrace + 1);
  const parsed: UIJSON = JSON.parse(cleaned);

  const validTypes = COMPONENTS.map((c) => c.type);
  if (!validTypes.includes(parsed.type)) {
    throw new Error(`Invalid UI type: ${parsed.type}`);
  }

  function validateFlatProps(node: UIJSON): void {
    if (!node.props || typeof node.props !== "object") return;
    for (const [k, v] of Object.entries(node.props)) {
      if (v !== undefined && typeof v !== "string") {
        throw new Error(
          `Prop "${k}" must be a string, got ${typeof v}. Use "layout" type with "children" for nested structures.`
        );
      }
    }
    if (node.children) {
      for (const child of node.children) {
        validateFlatProps(child);
      }
    }
  }
  validateFlatProps(parsed);

  function ensureLayout(node: UIJSON): void {
    if (!node.layout || typeof node.layout !== "object") {
      node.layout = { x: 0, y: 0, w: 200, h: 160 };
    }
    if (node.children) {
      for (const child of node.children) {
        ensureLayout(child);
      }
    }
  }
  ensureLayout(parsed);

  return parsed;
}

export async function generateBlock(
  prompt: string,
  model: string,
  catalogContext?: CatalogEntry[]
): Promise<UIJSON> {
  const systemPrompt = buildSystemPrompt(prompt, catalogContext);
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: systemPrompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama generate error: ${res.statusText}`);
  const data = await res.json();
  return parseAndValidate(data.response ?? "");
}

export type StreamCallbacks = {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
};

export function generateBlockStream(
  prompt: string,
  model: string,
  catalogContext: CatalogEntry[] | undefined,
  callbacks: StreamCallbacks
): AbortController {
  const systemPrompt = buildSystemPrompt(prompt, catalogContext);
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: systemPrompt, stream: true }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Ollama generate error: ${res.statusText}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            const token = chunk.response ?? "";
            full += token;
            callbacks.onToken(token);
          } catch { /* skip malformed line */ }
        }
      }

      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          const token = chunk.response ?? "";
          full += token;
          callbacks.onToken(token);
        } catch { /* skip */ }
      }

      callbacks.onDone(full);
    } catch (e) {
      if (controller.signal.aborted) return;
      callbacks.onError(e instanceof Error ? e : new Error(String(e)));
    }
  })();

  return controller;
}
