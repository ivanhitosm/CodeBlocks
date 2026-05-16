import type { UIJSON } from "../types";

function renderElement(ui: UIJSON, indent: number): string {
  const pad = "  ".repeat(indent);
  const compName = ui.type.charAt(0).toUpperCase() + ui.type.slice(1);

  const propsEntries = Object.entries(ui.props).filter(
    ([, v]) => v !== undefined
  );
  const propsStr = propsEntries
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(" ");

  if (ui.children && ui.children.length > 0) {
    const childrenLines = ui.children
      .map((child) => renderElement(child, indent + 1))
      .join("\n");

    return `${pad}<${compName}${propsStr ? ` ${propsStr}` : ""}>\n${childrenLines}\n${pad}</${compName}>`;
  }

  return `${pad}<${compName}${propsStr ? ` ${propsStr}` : ""} />`;
}

export function deriveCode(ui: UIJSON): string {
  return `export default function Block() {\n  return (\n${renderElement(ui, 2)}\n  );\n}`;
}
