import type { Block, CanvasView, CatalogEntry } from "../types";

export type ExportedBlock = {
  format: "codeblocks-block";
  version: 1;
  block: Block;
  exportedAt: number;
};

export type ExportedView = {
  format: "codeblocks-view";
  version: 1;
  view: CanvasView;
  blocks: Block[];
  exportedAt: number;
};

export type ExportedProject = {
  format: "codeblocks-project";
  version: 1;
  views: CanvasView[];
  blocks: Block[];
  catalogEntries: CatalogEntry[];
  exportedAt: number;
};

export function exportBlock(block: Block): ExportedBlock {
  return { format: "codeblocks-block", version: 1, block, exportedAt: Date.now() };
}

export function exportView(
  view: CanvasView,
  blocks: Record<string, Block>
): ExportedView {
  return {
    format: "codeblocks-view",
    version: 1,
    view,
    blocks: view.blockIds.map((id) => blocks[id]).filter(Boolean),
    exportedAt: Date.now(),
  };
}

export function exportProject(
  views: Record<string, CanvasView>,
  blocks: Record<string, Block>,
  catalogEntries: CatalogEntry[]
): ExportedProject {
  return {
    format: "codeblocks-project",
    version: 1,
    views: Object.values(views),
    blocks: Object.values(blocks),
    catalogEntries,
    exportedAt: Date.now(),
  };
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyJson(data: unknown): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

export type ExportedCatalog = {
  format: "codeblocks-catalog";
  version: 1;
  entries: CatalogEntry[];
  exportedAt: number;
};

export function exportCatalogEntries(entries: CatalogEntry[]): ExportedCatalog {
  return { format: "codeblocks-catalog", version: 1, entries, exportedAt: Date.now() };
}

export function parseImportedJson(
  text: string
): ExportedBlock | ExportedView | ExportedProject | ExportedCatalog {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || !parsed.format) {
    throw new Error("Invalid export format: missing 'format' field");
  }
  const validFormats = ["codeblocks-block", "codeblocks-view", "codeblocks-project", "codeblocks-catalog"];
  if (!validFormats.includes(parsed.format)) {
    throw new Error(`Unknown export format: ${parsed.format}`);
  }
  if (parsed.version !== 1) {
    throw new Error(`Unsupported version: ${parsed.version}`);
  }
  return parsed as ExportedBlock | ExportedView | ExportedProject | ExportedCatalog;
}
