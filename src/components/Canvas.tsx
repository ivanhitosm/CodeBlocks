import { useCallback, useRef, useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { useStore } from "../store/useStore";
import { deriveCatalog } from "../utils/deriveCatalog";
import { deriveCode } from "../utils/deriveCode";
import type { UIJSON, Block } from "../types";
import BlockView from "./BlockView";
import PromptPopover from "./PromptPopover";
import ContextMenu from "./ContextMenu";
import BlockContextMenu from "./BlockContextMenu";
import Header from "./Header";
import CatalogPanel from "./CatalogPanel";
import GenerationConsole from "./GenerationConsole";
import ErrorBoundary from "./ErrorBoundary";
import ConnectionLines from "./ConnectionLines";

export default function Canvas() {
  const blocks = useStore((s) => s.blocks);
  const views = useStore((s) => s.views);
  const activeViewId = useStore((s) => s.activeViewId);
  const setSelected = useStore((s) => s.setSelected);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeView = views[activeViewId];
  const visibleBlockIds = activeView?.blockIds ?? [];
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [blockMenu, setBlockMenu] = useState<{ x: number; y: number; blockId: string } | null>(null);
  const [promptPos, setPromptPos] = useState<{ x: number; y: number; mode: "block" | "logic" | "catalog" | "redo"; blockId?: string } | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [zoom, setZoom] = useState(1);
  const triggerExecution = useStore((s) => s.triggerExecution);
  const isExecuting = useStore((s) => s.isExecuting);
  const blockCount = useStore((s) => Object.keys(s.blocks).length);

  const TARGET_WIDTHS: Record<string, number> = { mobile: 375, tablet: 768, desktop: 1280 };
  const viewportWidth = activeView?.target ? TARGET_WIDTHS[activeView.target] : 0;

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      const blockEl = (e.target as HTMLElement).closest("[data-block-id]");
      const store = useStore.getState();
      if (blockEl) {
        const blockId = blockEl.getAttribute("data-block-id")!;
        if (e.ctrlKey || e.metaKey) {
          store.toggleSelection(blockId);
        } else if (!store.selectedBlockIds.includes(blockId)) {
          setSelected(blockId);
        }
      } else if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas]")) {
        setSelected(null);
      }
    },
    [setSelected]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const blockEl = (e.target as HTMLElement).closest("[data-block-id]");
    const store = useStore.getState();
    if (blockEl) {
      const blockId = blockEl.getAttribute("data-block-id")!;
      if (!store.selectedBlockIds.includes(blockId)) {
        setSelected(blockId);
      }
      setBlockMenu({ x: e.clientX, y: e.clientY, blockId });
    } else if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas]")) {
      setSelected(null);
      setMenuPos({ x: e.clientX, y: e.clientY });
    }
  }, [setSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let ui: UIJSON;
    try { ui = JSON.parse(raw); } catch { return; }
    if (!ui.type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top - 44) / zoom;
    const bw = ui.layout?.w ?? 200;
    const bh = ui.layout?.h ?? 160;
    const headerBottom = 44;
    const cx = Math.max(2, Math.min(x, window.innerWidth - bw - 2));
    const cy = Math.max(headerBottom, Math.min(y, window.innerHeight - bh - 2));

    const block: Block = {
      id: uuid(),
      position: { x: Math.round(cx), y: Math.round(cy) },
      size: { w: bw, h: bh },
      ui_json: ui,
      catalog_json: deriveCatalog(ui),
      static_code: deriveCode(ui),
    };
    useStore.getState().addBlock(block);
  }, [zoom]);

  const revealAll = useCallback(() => {
    const { blocks, updateBlock: ub } = useStore.getState();
    const padding = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const headerBottom = 44;
    let minX = Infinity;
    for (const block of Object.values(blocks)) {
      if (block.position.x < minX) minX = block.position.x;
    }
    const offsetX = Math.max(0, -(minX - padding));
    for (const block of Object.values(blocks)) {
      let nx = block.position.x;
      let ny = block.position.y;
      if (nx < 0 || ny < headerBottom || nx + block.size.w > vw || ny + block.size.h > vh) {
        nx = Math.max(padding, Math.min(nx + offsetX, vw - block.size.w - padding));
        ny = Math.max(headerBottom, Math.min(ny, vh - block.size.h - padding));
        ub(block.id, { position: { x: Math.round(nx), y: Math.round(ny) } });
      }
    }
  }, []);

  const dismissAll = useCallback(() => {
    setMenuPos(null);
    setBlockMenu(null);
    setPromptPos(null);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const store = useStore.getState();
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        store.redo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="h-full w-full">
      <Header onCatalog={() => setShowCatalog(true)} onConsole={() => setShowConsole((v) => !v)} />
      <div
        ref={canvasRef}
        className="relative h-full w-full overflow-hidden bg-gray-50 pt-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-canvas
      >
        <div
          className="relative mx-auto min-h-full"
          style={viewportWidth ? { maxWidth: viewportWidth } : undefined}
        >
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
          >
            {visibleBlockIds.map((id) => blocks[id]).filter(Boolean).map((block) => (
              <ErrorBoundary key={block.id}>
                <BlockView block={block} zoom={zoom} />
              </ErrorBoundary>
            ))}
            <ConnectionLines zoom={zoom} containerRef={canvasRef} />
          </div>
        </div>

      <div
        className="fixed right-4 z-30 flex flex-col gap-2"
        style={{ bottom: showConsole ? 260 : 16 }}
      >
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 disabled:opacity-40"
          title="Reveal all blocks on screen"
          onClick={revealAll}
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-green-50 disabled:opacity-40"
          title={isExecuting ? "Executing..." : "Run all blocks"}
          disabled={isExecuting || blockCount === 0}
          onClick={() => triggerExecution()}
        >
          <svg className={`h-4 w-4 ${isExecuting ? "animate-spin text-blue-500" : "text-green-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <div
        className="fixed left-4 z-30 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-md"
        style={{ bottom: showConsole ? 260 : 16 }}
      >
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}
          disabled={zoom <= 0.25}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <span className="min-w-[3ch] text-center text-[11px] font-medium text-gray-600">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
          disabled={zoom >= 3}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
          title="Reset zoom"
          onClick={() => setZoom(1)}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {blockMenu && (
        <BlockContextMenu
          x={blockMenu.x}
          y={blockMenu.y}
          blockId={blockMenu.blockId}
          onRedo={(id) => {
            setPromptPos({ x: blockMenu.x, y: blockMenu.y, mode: "redo", blockId: id });
            setBlockMenu(null);
          }}
          onClose={() => setBlockMenu(null)}
        />
      )}

      {menuPos && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          onCreateBlock={() => {
            setPromptPos({ ...menuPos, mode: "block" });
            setMenuPos(null);
          }}
          onCreateLogicBlock={() => {
            setPromptPos({ ...menuPos, mode: "logic" });
            setMenuPos(null);
          }}
          onAddToCatalog={() => {
            setPromptPos({ ...menuPos, mode: "catalog" });
            setMenuPos(null);
          }}
          onClose={dismissAll}
        />
      )}

      {promptPos && (
        <PromptPopover
          x={promptPos.x}
          y={promptPos.y}
          mode={promptPos.mode}
          blockId={promptPos.blockId}
          onClose={() => setPromptPos(null)}
        />
      )}
    </div>

      {showCatalog && <CatalogPanel onClose={() => setShowCatalog(false)} onDrop={handleDrop} />}

      {showConsole && (
        <div className="fixed bottom-0 left-0 right-0 z-40 h-60 border-t border-gray-300 bg-white shadow-inner">
          <GenerationConsole />
        </div>
      )}
    </div>
  );
}
