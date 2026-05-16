# CodeBlocks — AI Multi-View Canvas

An infinite canvas application where you describe UI blocks in natural language and an LLM (Ollama) generates them as draggable, resizable blocks with multiple synchronized views.

> **Phase:** AI-generated blocks becoming reusable, inspectable, exportable application primitives.
> See [`plan.md`](./plan.md) for the full development roadmap.

## Tech Stack

- **Vite** — build tool
- **React 19** — UI framework
- **TypeScript** — type safety
- **Zustand + persist** — state management with localStorage persistence
- **react-rnd** — drag + resize
- **Tailwind CSS v4** — styling
- **Ollama** — local LLM inference

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) running at `http://localhost:11434`
- At least one model pulled (e.g., `ollama pull llama3.1`)

## Getting Started

```bash
# Install dependencies
npm install

# Make sure Ollama is running
ollama serve

# Start dev server
npm run dev
```

## Usage

### Create a block
1. **Right-click** on blank canvas → "Create UI Block"
2. Select a model from the dropdown
3. Describe the UI (e.g., "a card with title Weather and description Sunny")
4. Press Enter or click Generate

### Interact with blocks
- **Left-click + drag** — move a block
- **Drag edges/corners** — resize a block
- **Right-click on block** → Delete, Redo, or Add to Catalog
- **Left-click canvas** — deselect

### Views (per block)
Each block has 4 tabs:
| Tab | Description |
|-----|-------------|
| UI | Rendered component preview |
| JSON | Raw UI JSON schema |
| Catalog | Nested AST tree |
| Code | Generated TSX code |

Non-UI tabs (JSON, Catalog, Code) include a **Copy** button in the header — click to copy the tab content to clipboard.

### Catalog
- **Hamburger menu → Catalog** — shows all available component types with props, preview, and example JSON
- Built-in types + user-added entries (from "Add to Catalog" in context menus)

### Redo a block
Right-click a block → "Redo Block" → describe changes → the block is regenerated in-place.

### Add to Catalog
- **From blank canvas** — Right-click → "Add to Catalog" → describe a new component type → saved as a catalog entry
- **From a block** — Right-click block → "Add to Catalog" → derives entry from existing block data

### Composite blocks (layout + children)
Multi-component blocks use `type: "layout"` with a `children` array:

```
layout (label="Login Form")
├── input (label="Email", placeholder="enter email")
├── input (label="Password", placeholder="enter password")
└── button (label="Submit")
```

Each child is a valid block component with its own `type`, `props`, and `layout`.
Props values **must** be flat strings — nested objects/arrays are rejected.

### Block connections
Blocks expose typed **ports** (green input dots on the left, blue output dots on the right):
- **Drag from an output port** → a dashed line follows the mouse
- **Drop on an input port** → creates a persistent connection (bezier curve with arrow)
- **Hover a connection** → shows "Click to remove" label
- Type mismatch is prevented at connection time (e.g., `number` ports can't connect to `string` ports)

### Runtime execution
Logic blocks (math, filter, merge, switch, template) form a dataflow graph via connections:
- Click the **Run ▶ button** (bottom-right) to execute the full graph
- Execution follows connection order (topological sort with cycle detection)
- Computed data values appear as labels on connection lines
- Logic block borders change color: **green** (success), **red** (error), **blue** (running)
- Auto-executes when new connections are added

### Clear all
Hamburger menu → "Clear All" — removes all blocks from the canvas.

## Component Types

### UI Components

| Type | Props |
|------|-------|
| card | title, description |
| button | label |
| text | title, description, label |
| input | label, placeholder, disabled |
| select | label, options (comma-separated) |
| badge | label, color |
| alert | title, description, variant |
| progress | label, value (0-100) |
| image | src, alt, width, height |
| checkbox | label, checked, disabled |
| toggle | label, checked |
| avatar | name, src, size |
| divider | label |
| layout | label (composite container — use `children` array for multi-component blocks) |

### Logic Blocks

| Type | Props | Function |
|------|-------|----------|
| math | label, operation (add/subtract/multiply/divide) | Arithmetic on input ports A and B |
| filter | label, condition (truthy/falsy) | Routes value to Passed or Failed output |
| merge | label | Combines inputs A and B into merged output |
| switch | label, cases (comma-separated) | Routes value to Matched or Default output |
| template | label | String interpolation (`{{var}}` in input text) |
| http | label | Placeholder — not yet supported in-canvas |

## Architecture

### Data flow
```
Canvas click → ContextMenu → PromptPopover → Ollama API → UI JSON → Block creation → Derived views
```

### State management
All state is managed via Zustand and persisted to localStorage under the key `codeblocks-canvas`:
- `blocks` — record of all blocks keyed by ID
- `views` — named views scoping block visibility
- `connections` — port-to-port connections (persisted, undoable)
- `catalogEntries` — user-added catalog entries
- `runtimeResults` — ephemeral execution outputs (not persisted)
- `past` / `future` — undo/redo history stacks
- `selectedBlockIds` — multi-selection state
- `selectedModel` — chosen Ollama model

### Registry system
Components are defined declaratively in `src/registry/index.tsx`. Each entry in the `COMPONENTS` array includes:
- `type` — JSON type string
- `name` — display name
- `propNames` — accepted prop names
- `example` — example JSON for the catalog
- `render` — preview render function
- `component` — React component
- `composite` — flag for container types (layout)

Adding a new component type requires only one entry in this array — the catalog, LLM prompt, and validation update automatically.

### Derivation functions (pure, not AI-generated)
- `deriveCatalog` — UI JSON → nested AST tree
- `deriveCode` — UI JSON → TSX template string

### Error handling
- All registry components use `str()` utility for safe string coercion
- Each block is wrapped in an `ErrorBoundary` — one corrupted block cannot crash the entire canvas
- LLM output is validated at parse time:
  - `validateFlatProps` — rejects nested objects/arrays in `props` (must be flat strings only)
  - `ensureLayout` — fills missing `layout` on every node with safe defaults (`{x:0,y:0,w:200,h:160}`)
- All `layout` access in the codebase uses optional chaining with fallback values (`ui.layout?.w ?? 200`)

## Project Structure

```
src/
  types/index.ts              — Block, UIJSON, CatalogJSON, PortDescriptor, Connection, ExecutionResult, etc.
  store/useStore.ts           — Zustand store with persist + undo/redo
  services/ollama.ts          — Ollama API client (fetch models + generate)
  utils/
    str.ts                    — Safe string coercion utility
    deriveCatalog.ts          — UIJSON → CatalogJSON
    deriveCode.ts             — UIJSON → TSX template
    portDefinitions.ts        — Port descriptors per component type + type checking
    connection.ts             — Shared port/connection utility constants and bezierPath
    runtime.ts                — Graph execution engine (topological sort, block execution)
    export.ts                 — Serialization/deserialization for blocks, views, projects
  registry/
    index.tsx                 — COMPONENTS array + derived registry map
    Card.tsx, Button.tsx...   — Individual UI component renderers
    LogicBlock.tsx            — Unified renderer for all 6 logic block types
  components/
    Canvas.tsx                — Infinite dot-grid canvas + zoom controls + Run button
    BlockView.tsx             — Rnd wrapper + tab header + port circles + execution border
    BlockContext.ts           — React context providing block ID to registry components
    ConnectionLines.tsx       — SVG overlay: bezier curves, drag-to-connect, data value labels
    ContextMenu.tsx           — Right-click menu (blank canvas)
    BlockContextMenu.tsx      — Right-click menu (block)
    PromptPopover.tsx         — Model selector + prompt textarea
    CatalogPanel.tsx          — Side panel showing all components
    Header.tsx                — Top bar with hamburger menu, view switcher, undo/redo
    GenerationConsole.tsx     — Docked AI generation event log
    ErrorBoundary.tsx         — Catches render errors per block
    views/
      UIView.tsx              — Recursive component renderer
      JsonView.tsx            — Raw JSON display
      CatalogView.tsx         — Tree renderer
      CodeView.tsx            — TSX code display
```

## Extending

### Add a new component type
1. Create `src/registry/MyComp.tsx` — accept `Record<string, string | undefined>` props, use `str()` for string coercion
2. Add one entry to `COMPONENTS` in `src/registry/index.tsx` — import + descriptor

That's it. The catalog panel, LLM system prompt, type validation, and registry all update automatically.
