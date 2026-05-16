import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { exportView, exportProject, exportCatalogEntries, downloadJson, copyJson, parseImportedJson } from "../utils/export";
import type { ExportedProject } from "../utils/export";

type Props = {
  onCatalog: () => void;
  onConsole: () => void;
};

export default function Header({ onCatalog, onConsole }: Props) {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const clearBlocks = useStore((s) => s.clearBlocks);
  const views = useStore((s) => s.views);
  const activeViewId = useStore((s) => s.activeViewId);
  const setActiveView = useStore((s) => s.setActiveView);
  const setViewTarget = useStore((s) => s.setViewTarget);
  const createView = useStore((s) => s.createView);
  const renameView = useStore((s) => s.renameView);
  const removeView = useStore((s) => s.removeView);
  const duplicateView = useStore((s) => s.duplicateView);
  const blockCount = useStore((s) => Object.keys(s.blocks).length);
  const activeView = views[activeViewId];
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const createViewStore = useStore((s) => s.createView);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const catalogImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!viewOpen) return;
    const handler = (e: MouseEvent) => {
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) {
        setViewOpen(false);
        setRenaming(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [viewOpen]);

  function startRename(id: string, current: string) {
    setRenaming(id);
    setRenameValue(current);
  }

  function commitRename(id: string) {
    if (renameValue.trim()) renameView(id, renameValue.trim());
    setRenaming(null);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const data = parseImportedJson(text);
        const state = useStore.getState();

        if (data.format === "codeblocks-project") {
          const project = data as ExportedProject;
          for (const block of project.blocks) {
            state.addBlock(block);
          }
          for (const entry of project.catalogEntries) {
            state.addCatalogEntry(entry);
          }
          for (const view of project.views) {
            const existing = Object.values(state.views).find((v) => v.name === view.name);
            if (!existing) {
              const vid = createViewStore(view.name, view.target);
              useStore.getState().views[vid].blockIds.push(...view.blockIds);
            }
          }
        } else {
          throw new Error("Only .codeblocks-project files are supported for import");
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Import failed");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={importRef}
        type="file"
        accept=".json,.codeblocks-project.json"
        className="hidden"
        onChange={handleImport}
      />
      <input
        ref={catalogImportRef}
        type="file"
        accept=".json,.codeblocks-catalog.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = parseImportedJson(reader.result as string);
              if (data.format !== "codeblocks-catalog") throw new Error("Not a catalog file");
              const { addCatalogEntry: addEntry } = useStore.getState();
              for (const entry of (data as typeof data & { entries: import("../types").CatalogEntry[] }).entries) {
                addEntry(entry);
              }
            } catch (err) {
              alert(err instanceof Error ? err.message : "Import failed");
            }
          };
          reader.readAsText(file);
          e.target.value = "";
        }}
      />
      <div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">CodeBlocks</span>

          <div className="flex items-center gap-0.5 mr-1">
            <button
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              title="Undo (Ctrl+Z)"
              onClick={undo}
              disabled={!canUndo}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              title="Redo (Ctrl+Shift+Z)"
              onClick={redo}
              disabled={!canRedo}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

        <div className="relative" ref={viewRef}>
          <button
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            onClick={() => setViewOpen(!viewOpen)}
          >
            {activeView?.name ?? "View"}
            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {viewOpen && (
            <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {Object.values(views).map((v) => (
                <div key={v.id} className="flex items-center gap-1 px-2 py-1 hover:bg-gray-50">
                  <button
                    className={`min-w-0 flex-1 truncate rounded px-2 py-1 text-left text-xs ${
                      v.id === activeViewId ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"
                    }`}
                    onClick={() => { setActiveView(v.id); setViewOpen(false); }}
                  >
                    {renaming === v.id ? (
                      <input
                        className="w-full rounded border border-blue-400 px-1 py-0 text-xs outline-none"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(v.id);
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        onBlur={() => commitRename(v.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span onDoubleClick={() => startRename(v.id, v.name)}>{v.name}</span>
                    )}
                    <span className="ml-1 text-gray-400">({v.blockIds.length})</span>
                  </button>

                  <button
                    className="shrink-0 rounded p-0.5 text-gray-300 hover:text-blue-500"
                    title="Duplicate"
                    onClick={() => duplicateView(v.id)}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  <button
                    className="shrink-0 rounded p-0.5 text-gray-300 hover:text-green-500"
                    title="Export View"
                    onClick={() => {
                      downloadJson(
                        exportView(v, useStore.getState().blocks),
                        `view-${v.name.replace(/\s+/g, "-").toLowerCase()}.codeblocks-view.json`
                      );
                    }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>

                  <button
                    className="shrink-0 rounded p-0.5 text-gray-300 hover:text-blue-500"
                    title="Copy View JSON"
                    onClick={() => {
                      copyJson(exportView(v, useStore.getState().blocks));
                    }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {v.id !== "default" && (
                    <button
                      className="shrink-0 rounded p-0.5 text-gray-300 hover:text-red-500"
                      title="Delete"
                      onClick={() => removeView(v.id)}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <div className="mx-2 border-t border-gray-100" />
              <div className="flex items-center gap-0.5 px-3 py-1.5">
                <span className="text-[10px] font-medium text-gray-400">Viewport:</span>
                {([undefined, "mobile", "tablet", "desktop"] as const).map((t) => {
                  const label = t === undefined ? "Full" : t.charAt(0).toUpperCase() + t.slice(1);
                  const active = activeView?.target === t;
                  return (
                    <button
                      key={t ?? "full"}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        active ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                      }`}
                      onClick={() => setViewTarget(activeViewId, t)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mx-2 border-t border-gray-100" />
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
                onClick={() => { createView(`View ${Object.keys(views).length + 1}`); setViewOpen(false); }}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New View
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setOpen(!open)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { onCatalog(); setOpen(false); }}
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Catalog
            </button>

            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { onConsole(); setOpen(false); }}
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Console
            </button>

            <div className="mx-2 border-t border-gray-100" />

              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  downloadJson(
                    exportProject(
                      useStore.getState().views,
                      useStore.getState().blocks,
                      useStore.getState().catalogEntries
                    ),
                    "project.codeblocks-project.json"
                  );
                  setOpen(false);
                }}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Project
              </button>

              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  copyJson(
                    exportProject(
                      useStore.getState().views,
                      useStore.getState().blocks,
                      useStore.getState().catalogEntries
                    )
                  );
                  setOpen(false);
                }}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Project JSON
              </button>

              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => { importRef.current?.click(); setOpen(false); }}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L5 8m4-4v12" />
                </svg>
                Import Project
              </button>

              <div className="mx-2 border-t border-gray-100" />

              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  downloadJson(
                    exportCatalogEntries(useStore.getState().catalogEntries),
                    "catalog.codeblocks-catalog.json"
                  );
                  setOpen(false);
                }}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Catalog
              </button>

              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => { catalogImportRef.current?.click(); setOpen(false); }}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L5 8m4-4v12" />
                </svg>
                Import Catalog
              </button>

            <div className="mx-2 border-t border-gray-100" />

            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              disabled={blockCount === 0}
              onClick={() => { clearBlocks(); setOpen(false); }}
            >
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
              {blockCount > 0 && <span className="ml-auto text-xs text-gray-400">({blockCount})</span>}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
