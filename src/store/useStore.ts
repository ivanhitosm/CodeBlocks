import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Block, CanvasView, CatalogEntry, Connection, ExecutionResult, GenerationEvent, UIJSON } from "../types";
import { executeGraph } from "../utils/runtime";

type Store = {
  blocks: Record<string, Block>;
  views: Record<string, CanvasView>;
  activeViewId: string;
  selectedBlockIds: string[];
  selectedModel: string;
  catalogEntries: CatalogEntry[];
  catalogSchemaVersion: number;
  generationLog: GenerationEvent[];
  streamingText: string;
  isStreaming: boolean;
  past: UndoState[];
  future: UndoState[];
  connections: Connection[];
  addConnection: (conn: Connection) => void;
  removeConnection: (id: string) => void;
  undo: () => void;
  redo: () => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  runtimeResults: Record<string, ExecutionResult>;
  isExecuting: boolean;
  setRuntimeResults: (results: Record<string, ExecutionResult>) => void;
  triggerExecution: (blockId?: string) => void;
  removeBlock: (id: string) => void;
  clearBlocks: () => void;
  setSelected: (id: string | null) => void;
  toggleSelection: (id: string) => void;
  setModel: (model: string) => void;
  addCatalogEntry: (entry: CatalogEntry) => void;
  removeCatalogEntry: (id: string) => void;
  addGenerationEvent: (event: GenerationEvent) => void;
  clearGenerationLog: () => void;
  setStreaming: (text: string) => void;
  appendStreaming: (token: string) => void;
  clearStreaming: () => void;
  createView: (name: string, target?: CanvasView["target"]) => string;
  renameView: (id: string, name: string) => void;
  removeView: (id: string) => void;
  duplicateView: (id: string) => void;
  setActiveView: (id: string) => void;
  setViewTarget: (id: string, target: CanvasView["target"]) => void;
  moveBlockToView: (blockId: string, viewId: string) => void;
};

type UndoState = {
  blocks: Record<string, Block>;
  views: Record<string, CanvasView>;
  activeViewId: string;
  selectedBlockIds: string[];
  selectedModel: string;
  catalogEntries: CatalogEntry[];
  connections: Connection[];
};

function migrateOldEntry(old: Record<string, unknown>): CatalogEntry {
  return {
    id: String(old.id),
    name: String(old.name),
    tags: [String((old as Record<string, unknown>).tag ?? "")],
    ui: (old as Record<string, unknown>).example as UIJSON,
    createdAt: Date.now(),
  };
}

function needsMigration(entries: unknown[]): boolean {
  return entries.length > 0 && typeof entries[0] === "object" && entries[0] !== null && !("ui" in (entries[0] as Record<string, unknown>));
}

function createView(name: string, target?: CanvasView["target"]): CanvasView {
  return { id: uuid(), name, target, blockIds: [], createdAt: Date.now() };
}

const DEFAULT_VIEW_ID = "default";

function captureUndo(state: Store): UndoState {
  return {
    blocks: state.blocks,
    views: state.views,
    activeViewId: state.activeViewId,
    selectedBlockIds: state.selectedBlockIds,
    selectedModel: state.selectedModel,
    catalogEntries: state.catalogEntries,
    connections: state.connections,
  };
}

function withUndo(state: Store, mutate: (s: Store) => Partial<Store>): Partial<Store> {
  const snap = captureUndo(state);
  return {
    past: [...state.past.slice(-49), snap],
    future: [],
    ...mutate(state),
  };
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      blocks: {},
      views: { [DEFAULT_VIEW_ID]: { id: DEFAULT_VIEW_ID, name: "Default", blockIds: [], createdAt: Date.now() } },
      activeViewId: DEFAULT_VIEW_ID,
      selectedBlockIds: [],
      selectedModel: "llama3.1:latest",
      catalogEntries: [],
      catalogSchemaVersion: 2,
      generationLog: [],
      streamingText: "",
      isStreaming: false,
      past: [],
      future: [],
      connections: [],
      runtimeResults: {},
      isExecuting: false,

      setRuntimeResults: (results) => set({ runtimeResults: results, isExecuting: false }),

      triggerExecution: (blockId) => {
        useStore.setState({ isExecuting: true });
        const current = useStore.getState();
        const existingResults = blockId ? current.runtimeResults : undefined;
        const result = executeGraph(current.blocks, current.connections, blockId, existingResults);
        if ("error" in result) {
          useStore.setState({ isExecuting: false });
          return;
        }
        useStore.setState({ runtimeResults: result.results, isExecuting: false });
      },

      addConnection: (conn) => {
        set((state) => withUndo(state, (s) => ({
          connections: [...s.connections, conn],
        })));
        setTimeout(() => {
          const s = useStore.getState();
          s.triggerExecution(conn.sourceBlockId);
        }, 0);
      },

      removeConnection: (id) =>
        set((state) => withUndo(state, (s) => ({
          connections: s.connections.filter((c) => c.id !== id),
        }))),

      undo: () =>
        set((state) => {
          const prev = state.past.at(-1);
          if (!prev) return state;
          return {
            ...prev,
            past: state.past.slice(0, -1),
            future: [captureUndo(state), ...state.future],
          };
        }),

      redo: () =>
        set((state) => {
          const next = state.future.at(0);
          if (!next) return state;
          return {
            ...next,
            past: [...state.past, captureUndo(state)],
            future: state.future.slice(1),
          };
        }),

      addBlock: (block) =>
        set((state) => withUndo(state, (s) => {
          const view = s.views[s.activeViewId];
          if (!view) return { blocks: { ...s.blocks, [block.id]: block } };
          return {
            blocks: { ...s.blocks, [block.id]: block },
            views: {
              ...s.views,
              [s.activeViewId]: { ...view, blockIds: [...view.blockIds, block.id] },
            },
          };
        })),

      updateBlock: (id, patch) =>
        set((state) => withUndo(state, (s) => {
          const existing = s.blocks[id];
          if (!existing) return {};
          return {
            blocks: { ...s.blocks, [id]: { ...existing, ...patch } },
          };
        })),

      removeBlock: (id) => {
        const runtimeResults = { ...useStore.getState().runtimeResults };
        delete runtimeResults[id];
        set((state) => withUndo(state, (s) => {
          const rest: Record<string, Block> = {};
          for (const [k, v] of Object.entries(s.blocks)) {
            if (k !== id) rest[k] = v;
          }
          const updatedViews: Record<string, CanvasView> = {};
          for (const [vk, vv] of Object.entries(s.views)) {
            updatedViews[vk] = { ...vv, blockIds: vv.blockIds.filter((b) => b !== id) };
          }
          return {
            blocks: rest,
            views: updatedViews,
            selectedBlockIds: s.selectedBlockIds.filter((bid) => bid !== id),
            connections: s.connections.filter((c) => c.sourceBlockId !== id && c.targetBlockId !== id),
            runtimeResults,
          };
        }));
      },

      clearBlocks: () =>
        set((state) => withUndo(state, (s) => {
          const clearedViews: Record<string, CanvasView> = {};
          for (const [vk, vv] of Object.entries(s.views)) {
            clearedViews[vk] = { ...vv, blockIds: [] };
          }
          return { blocks: {}, views: clearedViews, selectedBlockIds: [] };
        })),

      addCatalogEntry: (entry) =>
        set((state) => withUndo(state, (s) => ({ catalogEntries: [...s.catalogEntries, entry] }))),

      removeCatalogEntry: (id) =>
        set((state) => withUndo(state, (s) => ({ catalogEntries: s.catalogEntries.filter((e) => e.id !== id) }))),

      setSelected: (id) => set((state) => withUndo(state, () => ({ selectedBlockIds: id ? [id] : [] }))),
      toggleSelection: (id) =>
        set((state) => withUndo(state, (s) => {
          const has = s.selectedBlockIds.includes(id);
          return { selectedBlockIds: has ? s.selectedBlockIds.filter((bid) => bid !== id) : [...s.selectedBlockIds, id] };
        })),

      setModel: (model) => set({ selectedModel: model }),

      addGenerationEvent: (event) =>
        set((state) => ({ generationLog: [...state.generationLog, event] })),

      clearGenerationLog: () => set({ generationLog: [] }),

      setStreaming: (text) => set({ streamingText: text, isStreaming: true }),
      appendStreaming: (token) =>
        set((state) => ({ streamingText: state.streamingText + token })),
      clearStreaming: () => set({ streamingText: "", isStreaming: false }),

      createView: (name, target) => {
        const view = createView(name, target);
        set((state) => withUndo(state, (s) => ({ views: { ...s.views, [view.id]: view }, activeViewId: view.id })));
        return view.id;
      },

      renameView: (id, name) =>
        set((state) => withUndo(state, (s) => {
          const view = s.views[id];
          if (!view) return {};
          return { views: { ...s.views, [id]: { ...view, name } } };
        })),

      removeView: (id) =>
        set((state) => withUndo(state, (s) => {
          if (id === DEFAULT_VIEW_ID || !s.views[id]) return {};
          const rest: Record<string, CanvasView> = {};
          for (const [k, v] of Object.entries(s.views)) {
            if (k !== id) rest[k] = v;
          }
          return {
            views: rest,
            activeViewId: s.activeViewId === id ? DEFAULT_VIEW_ID : s.activeViewId,
          };
        })),

      duplicateView: (id) =>
        set((state) => withUndo(state, (s) => {
          const source = s.views[id];
          if (!source) return {};
          const view = createView(`${source.name} (copy)`, source.target);
          view.blockIds = [...source.blockIds];
          return { views: { ...s.views, [view.id]: view } };
        })),

      setActiveView: (id) => set((state) => withUndo(state, () => ({ activeViewId: id }))),

      setViewTarget: (id, target) =>
        set((state) => withUndo(state, (s) => {
          const view = s.views[id];
          if (!view) return {};
          return { views: { ...s.views, [id]: { ...view, target } } };
        })),

      moveBlockToView: (blockId, viewId) =>
        set((state) => withUndo(state, (s) => {
          const target = s.views[viewId];
          if (!target || target.blockIds.includes(blockId)) return {};
          const updatedViews: Record<string, CanvasView> = {};
          for (const [vk, vv] of Object.entries(s.views)) {
            updatedViews[vk] = { ...vv, blockIds: vv.blockIds.filter((b) => b !== blockId) };
          }
          updatedViews[viewId] = { ...target, blockIds: [...target.blockIds, blockId] };
          return { views: updatedViews };
        })),
    }),
    {
      name: "codeblocks-canvas",
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        const merged = { ...current, ...p };

        if (merged.catalogEntries && needsMigration(merged.catalogEntries as unknown[])) {
          merged.catalogEntries = (merged.catalogEntries as unknown[]).map(
            (e) => migrateOldEntry(e as Record<string, unknown>)
          );
        }

        const allBlockIds = Object.keys((merged.blocks ?? {}) as Record<string, unknown>);
        const mv = merged.views as Record<string, Record<string, unknown>> | undefined;

        if (!mv || Object.keys(mv).length === 0) {
          merged.views = { [DEFAULT_VIEW_ID]: { id: DEFAULT_VIEW_ID, name: "Default", blockIds: allBlockIds, createdAt: Date.now() } };
        } else {
          if (!mv[DEFAULT_VIEW_ID]) {
            mv[DEFAULT_VIEW_ID] = { id: DEFAULT_VIEW_ID, name: "Default", blockIds: allBlockIds, createdAt: Date.now() };
          } else {
            mv[DEFAULT_VIEW_ID].id = DEFAULT_VIEW_ID;
            const existingBlockIds = (mv[DEFAULT_VIEW_ID].blockIds as string[]) ?? [];
            if (existingBlockIds.length === 0 && allBlockIds.length > 0) {
              mv[DEFAULT_VIEW_ID].blockIds = allBlockIds;
            }
          }
        }

        if (!merged.activeViewId || !((merged.views as Record<string, unknown>)[merged.activeViewId as string])) {
          merged.activeViewId = DEFAULT_VIEW_ID;
        }

        return merged as Store;
      },
      partialize: (state) => {
        const persisted = { ...state };
        delete (persisted as Record<string, unknown>).generationLog;
        delete (persisted as Record<string, unknown>).streamingText;
        delete (persisted as Record<string, unknown>).isStreaming;
        delete (persisted as Record<string, unknown>).past;
        delete (persisted as Record<string, unknown>).future;
        delete (persisted as Record<string, unknown>).undo;
        delete (persisted as Record<string, unknown>).redo;
        delete (persisted as Record<string, unknown>).runtimeResults;
        delete (persisted as Record<string, unknown>).isExecuting;
        delete (persisted as Record<string, unknown>).setRuntimeResults;
        delete (persisted as Record<string, unknown>).triggerExecution;
        return persisted;
      },
    }
  )
);
