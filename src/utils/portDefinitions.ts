import type { PortDescriptor, UIJSON } from "../types";

const portDefs: Record<string, PortDescriptor[]> = {
  button: [
    { id: "click", label: "Click", type: "event", direction: "output" },
  ],
  input: [
    { id: "value", label: "Value", type: "string", direction: "output" },
    { id: "change", label: "Change", type: "event", direction: "output" },
  ],
  select: [
    { id: "value", label: "Value", type: "string", direction: "output" },
    { id: "change", label: "Change", type: "event", direction: "output" },
  ],
  checkbox: [
    { id: "checked", label: "Checked", type: "boolean", direction: "output" },
    { id: "change", label: "Change", type: "event", direction: "output" },
  ],
  toggle: [
    { id: "checked", label: "Checked", type: "boolean", direction: "output" },
    { id: "change", label: "Change", type: "event", direction: "output" },
  ],
  text: [
    { id: "value", label: "Value", type: "string", direction: "input" },
  ],
  card: [
    { id: "title", label: "Title", type: "string", direction: "input" },
    { id: "description", label: "Description", type: "string", direction: "input" },
  ],
  badge: [
    { id: "label", label: "Label", type: "string", direction: "input" },
  ],
  alert: [
    { id: "title", label: "Title", type: "string", direction: "input" },
    { id: "description", label: "Description", type: "string", direction: "input" },
  ],
  progress: [
    { id: "value", label: "Value", type: "number", direction: "input" },
  ],
  image: [],
  avatar: [],
  divider: [],
  layout: [],

  math: [
    { id: "a", label: "A", type: "number", direction: "input" },
    { id: "b", label: "B", type: "number", direction: "input" },
    { id: "result", label: "Result", type: "number", direction: "output" },
  ],
  filter: [
    { id: "value", label: "Value", type: "any", direction: "input" },
    { id: "passed", label: "Passed", type: "any", direction: "output" },
    { id: "failed", label: "Failed", type: "any", direction: "output" },
  ],
  merge: [
    { id: "a", label: "A", type: "any", direction: "input" },
    { id: "b", label: "B", type: "any", direction: "input" },
    { id: "merged", label: "Merged", type: "any", direction: "output" },
  ],
  switch: [
    { id: "value", label: "Value", type: "any", direction: "input" },
    { id: "matched", label: "Matched", type: "any", direction: "output" },
    { id: "default", label: "Default", type: "any", direction: "output" },
  ],
  template: [
    { id: "text", label: "Text", type: "string", direction: "input" },
    { id: "vars", label: "Vars", type: "any", direction: "input" },
    { id: "result", label: "Result", type: "string", direction: "output" },
  ],
  http: [
    { id: "url", label: "URL", type: "string", direction: "input" },
    { id: "method", label: "Method", type: "string", direction: "input" },
    { id: "response", label: "Response", type: "string", direction: "output" },
  ],
};

export function getPorts(type: string, children?: UIJSON[]): PortDescriptor[] {
  const own = portDefs[type] ?? [];
  if (type !== "layout" || !children || children.length === 0) return own;
  const aggregated: PortDescriptor[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childPorts = portDefs[child.type] ?? [];
    for (const p of childPorts) {
      aggregated.push({
        ...p,
        id: `c${i}-${p.id}`,
        label: `${child.type} ${p.label}`,
      });
    }
  }
  return aggregated;
}

export function canConnect(sourceType: string, targetType: string): boolean {
  if (sourceType === "any" || targetType === "any") return true;
  return sourceType === targetType;
}

const logicTypes = new Set(["math", "filter", "merge", "switch", "template", "http"]);

export function isLogicBlock(type: string): boolean {
  return logicTypes.has(type);
}
