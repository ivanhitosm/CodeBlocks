import { v4 as uuid } from "uuid";
import { useStore } from "../store/useStore";
import { exportBlock, downloadJson, copyJson } from "../utils/export";
import type { CatalogEntry, UIJSON } from "../types";

type Props = {
  x: number;
  y: number;
  blockId: string;
  onRedo: (blockId: string) => void;
  onClose: () => void;
};

function blockToEntry(name: string, ui: UIJSON, blockId: string): CatalogEntry {
  return {
    id: uuid(),
    name,
    tags: [ui.type],
    ui,
    createdAt: Date.now(),
    sourceBlockId: blockId,
    composite: ui.type === "layout",
  };
}

export default function BlockContextMenu({ x, y, blockId, onRedo, onClose }: Props) {
  const removeBlock = useStore((s) => s.removeBlock);
  const blocks = useStore((s) => s.blocks);
  const addCatalogEntry = useStore((s) => s.addCatalogEntry);
  const selectedBlockIds = useStore((s) => s.selectedBlockIds);
  const block = blocks[blockId];
  const multiCount = selectedBlockIds.length > 1 ? selectedBlockIds.length : 0;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        style={{ left: x, top: y }}
      >
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          onClick={() => {
            if (multiCount > 1) {
              for (const id of selectedBlockIds) removeBlock(id);
            } else {
              removeBlock(blockId);
            }
            onClose();
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {multiCount > 1 ? `Delete (${multiCount} selected)` : "Delete Block"}
        </button>

        {block && (
          <>
            <div className="mx-2 border-t border-gray-100" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { onRedo(blockId); onClose(); }}
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 9s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              </svg>
              Redo Block
            </button>
            <div className="mx-2 border-t border-gray-100" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                const entry = blockToEntry(block.ui_json.type.charAt(0).toUpperCase() + block.ui_json.type.slice(1), block.ui_json, block.id);
                addCatalogEntry(entry);
                onClose();
              }}
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Add to Catalog
            </button>
            <div className="mx-2 border-t border-gray-100" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { downloadJson(exportBlock(block), `block-${block.id.slice(0, 6)}.codeblocks-block.json`); onClose(); }}
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Block
            </button>
            <div className="mx-2 border-t border-gray-100" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { copyJson(exportBlock(block)); onClose(); }}
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Block JSON
            </button>
          </>
        )}
      </div>
    </>
  );
}
