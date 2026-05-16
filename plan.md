# CodeBlocks — Development Plan

> AI-generated blocks become reusable, inspectable, exportable application primitives.

## Product Direction

A block evolves from:
- visual preview → UI + structure + generation trace + reusable catalog component + exportable module + eventually behavior & logic

**Current phase:** Polish, fix gaps, and harden the connection graph + runtime execution system.

**Core philosophy:** schema-first, derivation-driven, registry-powered. The UI JSON schema is the canonical source of truth — everything (rendered UI, TSX code, catalog AST, generation traces, future logic graphs) derives from it.

---

## Phase 1 — Foundation Cleanup

**Goal:** Tidy up legacy code, align docs with current architecture, establish conventions.

### Tasks

- [x] Remove legacy `form` component from registry (all complex UIs should use `layout + children`)
- [x] Clean README component table to remove `form` and add note about `layout` composability
- [x] Ensure catalog panel doesn't reference removed types
- [x] Add roadmap/future section to README referencing this plan

---

## Phase 2 — Global Generation Console

**Goal:** Replace per-block Stream tab with a centralized realtime AI event console.

### Tasks

- [x] Add `GenerationEvent` type to `src/types/index.ts`
- [x] Add `generationLog: GenerationEvent[]` + actions to Zustand store (do NOT persist logs)
- [x] Create `GenerationConsole` component (docked, collapsible panel)
- [x] Add hamburger menu toggle to show/hide console
- [x] Wire `generateBlock` to push events into the log (prompt sent, raw response, validation steps, errors)
- [x] Support realtime streaming from Ollama (`stream: true` on `/api/generate` → push progressive tokens)
- [x] Group logs by block, allow collapse/expand
- [x] Add timestamps, event type badges, filtering/search
- [x] Add "clear console" action
- [x] Remove Stream tab from `BlockView.tsx`, hide `StreamView` component
- [x] Remove `deriveStream` utility (stream data is now event-based)

---

## Phase 3 — Catalog Evolution

**Goal:** Turn the catalog from a static component list into reusable, searchable, AI-native component memory.

### Tasks

- [x] Redesign `CatalogEntry` type (replace `props: string[]` + `example` with `ui: UIJSON` + `description` + `tags`)
- [x] Add localStorage migration for existing catalog entries (or version + clear)
- [x] Update `uiJsonToEntry` in `PromptPopover.tsx` to use new schema
- [x] Add category/tag system to catalog entries
- [x] Add search/filter UI to CatalogPanel
- [x] Add preview thumbnails in catalog (`MiniPreview` component)
- [x] Improve "Add to Catalog" — save blocks as reusable composites with metadata
- [x] Allow catalog-driven generation (pass relevant catalog entries into LLM context)
- [x] Add import/export for catalog entries (Export Catalog / Import Catalog in hamburger menu)
- [x] Add drag-and-drop from catalog to canvas

---

## Phase 4 — Views / Layout Spaces

**Goal:** Support organized multi-screen workflows beyond a single infinite canvas.

### Tasks

- [x] Add `CanvasView` type to `src/types/index.ts`
- [x] Refactor store: add `views` record, add `activeViewId`, scope blocks under views
- [x] Add view switcher UI in header (dropdown or tabs)
- [x] Support create / rename / delete views
- [x] Add target device metadata (mobile/tablet/desktop) with viewport preview
- [x] Add duplicate view action
- [x] Migrate existing blocks into a "Default" view on first load
- [x] Update canvas to render only blocks in the active view

---

## Phase 5 — Export System

**Goal:** Export reusable artifacts at multiple granularities for interoperability and portability.

### Tasks

- [x] Implement `exportBlock(blockId)` — serializes block + derivations + metadata
- [x] Implement `exportView(viewId)` — serializes all blocks in view + view metadata
- [x] Implement `exportProject()` — serializes views + catalog + metadata
- [x] Implement `importBlock(json)` / `importView(json)` / `importProject(json)` with validation
- [x] Add export button to block context menu (single block)
- [x] Add export button to view switcher (current view)
- [x] Add export/import in hamburger menu (full project)
- [x] Add clipboard export (copy TSX / JSON)
- [x] Add file download with `.codeblocks-*` extension
- [x] Add import validation against current schema
- [x] Export catalog entries as `.codeblocks-catalog.json`
- [x] Import catalog entries from file

---

## Phase 6 — Undo / Redo

**Goal:** Reliable editing history for all canvas operations.

### Tasks

- [x] Implement custom history stack in store (past/future arrays)
- [x] Define tracked state shape (`UndoState` excluding ephemeral fields)
- [x] Add undo / redo keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
- [x] Add undo / redo buttons in header
- [x] Limit history to 50 entries
- [x] Exclude ephemeral UI state from history
- [x] Wire `withUndo` helper into all mutating actions

---

## Phase 6.5 — Quick Polish Items

- [x] Snap blocks to grid (24px via `dragGrid`/`resizeGrid` on Rnd)
- [x] Canvas zoom controls (25%-300%, keyboard shortcuts, react-rnd `scale` prop)
- [x] Multi-select orchestration (`selectedBlockIds`, Ctrl+click toggle, group drag, batch delete)
- [x] Console-aware bottom buttons (shift up when console open)
- [x] Clipboard copy buttons (block, view, project JSON)
- [x] Drag blocks from catalog to canvas
- [x] Remove `deriveStream` / `StreamStep` / `streamed_json` (vestigial after real streaming)

---

## Phase 7 — Block Connection Lines / Graph Execution (DONE)

**Goal:** Visual links between blocks on the canvas. Click a connection to inspect, drag from output ports to input ports.

### Tasks

- [x] Add `Connection` and `PortDescriptor` types to `src/types/index.ts`
- [x] Add `connections: Connection[]` state + `addConnection` / `removeConnection` actions to Zustand store (with undo/redo)
- [x] Create `src/utils/portDefinitions.ts` — maps component types to their I/O ports with type labels
- [x] Render port circles on each block (blue output ports on right edge, green input ports on left edge)
- [x] Create `ConnectionLines` component — SVG overlay rendering bezier curves between connected ports
- [x] Drag from output port creates a dashed provisional line tracking the mouse
- [x] Drop on input port creates the connection with type checking (`canConnect`)
- [x] Hover a connection line to reveal "Click to remove" label; click to delete
- [x] Connections are cleaned up when a block is removed
- [x] Full undo/redo support for all connection mutations

### Implementation Notes

- Port positions are computed from block position/size in the store, no DOM measurement needed
- `getPortPosition` uses `useStore.getState()` for live reads during drag
- Drag state is ephemeral (not persisted, not in undo stack)
- Event delegation on the canvas container detects output port mousedowns
- `canConnect` allows same-type or `"any"` type matching (extensible for Phase 8 logic blocks)

---

## Phase 8 — Logic Blocks / Runtime Data Flow (DONE)

**Goal:** Blocks that compute, transform, and route data. Runtime execution engine that runs a graph of logic blocks.

### Tasks

- [x] Add `RuntimeValue`, `ExecutionResult`, `ExecutionStatus` types
- [x] Add input ports to display-oriented UI blocks (text, card, badge, alert, progress)
- [x] Add logic block port definitions (math, filter, merge, switch, template, http)
- [x] Create `LogicBlock.tsx` — unified renderer for all logic block types showing status/outputs
- [x] Add 6 logic blocks to registry (`COMPONENTS` array)
- [x] Build runtime engine in `src/utils/runtime.ts`:
  - Topological sort with cycle detection
  - Per-block execution (math ops, filter, merge, switch, template, http placeholder)
  - Data propagation through connections
  - Trigger-from-blockId incremental execution
- [x] Add `runtimeResults: Record<string, ExecutionResult>` to Zustand store (ephemeral, not persisted)
- [x] Add `triggerExecution(blockId?)` action + "Run All" button on canvas toolbar
- [x] Execution status indicator on logic block borders (green=success, red=error, blue=running)
- [x] `ConnectionLines` shows live data values flowing through each connection
- [x] Auto-execute on new connections
- [x] `BlockIdContext` so registry components can access their block ID
- [x] Clean up runtime results when blocks are deleted
- [x] 10 runtime unit tests (graph execution, cycle detection, data flow, getDataValueForConnection)

### Implementation Notes

- Runtime state (`runtimeResults`, `isExecuting`) is ephemeral — not persisted, not in undo stack
- `BlockIdContext` provides block ID to registry components via React context
- Logic blocks render inside UIView via registry lookup (same as UI components)
- `isLogicBlock()` utility distinguishes logic blocks from UI components
- HTTP blocks return an error: "not yet supported in-canvas"

---

## Gaps & Deferred Items

**Goal:** Fix known gaps and deferred design notes from Phases 7-8 before moving to new work.

### Bugs to Fix

- [x] **Input ports missing `data-port-type`** — `BlockView.tsx` now renders input ports with `data-port-type`, restoring type checking on connection drop.
- [x] **README.md outdated** — removed Stream tab references, added logic block table, connection lines + runtime execution sections, updated project structure.
- [x] **AGENTS.md stale gotcha** — removed stale missing-deps note.

### Deferred Design Items

- [x] **Layout block children ports** (Phase 7 key consideration) — Layout blocks expose their children's ports as their own on the outside edge. `getPorts(type, children)` aggregates children's port descriptors with `c{i}-` prefixed IDs.
- [x] **Incremental execution** — `triggerExecution(blockId)` now computes reachable subgraph via BFS, only processes affected blocks, and seeds inputs from `existingResults` for upstream blocks outside the subgraph.
- [x] **Scoped auto-execute on connection** — `addConnection` now passes `conn.sourceBlockId` to `triggerExecution`, only re-executing the downstream subgraph. Unrelated block results are preserved.

### Missing Test Coverage

- [x] **`portDefinitions.test.ts`** — 14 tests for `getPorts`, `canConnect`, `isLogicBlock`
- [x] **Runtime store actions** — 6 tests for `triggerExecution`, `setRuntimeResults`
- [x] **ConnectionLines component** — 6 tests for `bezierPath` SVG path generation and constants (`PORT_SPACING`, `HEADER_HEIGHT`)
- [x] **BlockView port rendering** — 7 tests for port circle rendering on button, input, text, divider, math, card block types

---

## Development Rules

- Small iterative commits
- Maintain registry-driven architecture (no component-specific hacks)
- Keep derivation functions pure (no side effects)
- Validate all AI outputs at parse time
- Prefer schema transforms over imperative mutations
- Use test-driven approach for new logic
- Update docs continuously
- Never bypass the registry system
- Schema changes must include localStorage migration or explicit breaking-change notes
