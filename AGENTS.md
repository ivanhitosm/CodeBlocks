# CodeBlocks — Agent Guide

## Commands

```sh
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build (project references)
npm run lint      # ESLint flat config
npm run preview   # Vite preview build
npm test          # vitest run (all tests)
npm run test:watch  # vitest watch mode
```

**Test framework:** Vitest v4 + `@testing-library/react` + `jsdom`.  
Config in `vitest.config.ts`, setup in `src/test/setup.ts`.  
See test files co-located alongside source: `src/**/*.test.ts`.

## Critical Architecture

- **Schema-first, derivation-driven, registry-powered.** `UIJSON` is the canonical source of truth. All other views (catalog, code) are derived via pure functions.
- **`COMPONENTS` array** (`src/registry/index.tsx`) is the single source of truth. Adding a component = create the file + add one entry. The catalog, LLM prompt, and type validation update automatically.
- Every registry component accepts `Record<string, string | undefined>` props and uses `str()` from `src/utils/str.ts` for safe coercion.
- Multi-component blocks **must** use `type: "layout"` with a `children: UIJSON[]` array. Nested objects/arrays in `props` are rejected by `validateFlatProps` in `ollama.ts`.
- Missing `layout` on any node is auto-filled by `ensureLayout` with `{x:0, y:0, w:200, h:160}` defaults.
- Each block is wrapped in an `ErrorBoundary` — one corrupted block won't crash the canvas.

## Testing Patterns

- **Pure functions** (`str`, `deriveCatalog`, `deriveCode`, `parseAndValidate`): test inputs and outputs directly with no setup.
- **Store** (`useStore`): reset state in `beforeEach` via `useStore.setState()`, wrap mutations in `act()`, assert with `useStore.getState()`.
- **Export utils** (`export.ts`): create fixture data inline, test serialization round-trips and error cases.
- **Component rendering** (`BlockView.test.tsx`): use `render()` from `@testing-library/react`, reset store with `useStore.setState()` in `beforeEach`, assert DOM via `document.querySelector` on `[data-port]`, `[data-block-id]` attributes.

## Non-obvious Gotchas

- **Ollama must be running** at `http://localhost:11434` with at least one model pulled (`ollama pull llama3.1`). No mock/offline mode.
- **TypeScript strict:** `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`. Use `type` keyword for type-only imports/exports.
- **Tailwind v4:** Uses `@tailwindcss/vite` plugin. No `tailwind.config.js` — all config is inline.
- **Persist key:** Zustand localStorage key is `codeblocks-canvas`. Schema changes break existing persisted state — clear localStorage or add migration.
- **Ports & connections:** `PortDescriptor[]` per component type in `src/utils/portDefinitions.ts`. `bezierPath`, `PORT_SPACING`, `HEADER_HEIGHT` live in `src/utils/connection.ts`. Layout blocks aggregate children's ports via `getPorts(type, children)` with `c{i}-` prefix. Connections stored in store as `Connection[]` (persisted, undoable). `ConnectionLines` SVG overlay in canvas uses event delegation for port interaction. Port positions derived from store block positions — no DOM measurement.
- **BlockIdContext** (`src/components/BlockContext.ts`): React context providing the current block ID to registry components. Wrapped in BlockView around the content area. Use `useBlockId()` to get the ID.
- **Runtime engine** (`src/utils/runtime.ts`): Pure functions `executeGraph()` and `getDataValueForConnection()`. Runtime results stored ephemerally in `runtimeResults` in store. Triggered via `triggerExecution()` action. Auto-executes after connection changes.

## Development Plan

See `plan.md`:
1. Foundation cleanup — done
2. Global generation console — done
3. Catalog evolution — done
4. Views/layout spaces — done
5. Export system — done
6. Undo/redo — done
6.5 Quick polish items — done
7. Block connection lines / graph execution — **done**
8. Logic blocks / runtime data flow — **done**

## Deferred (Not Current Focus)

- (all phases completed through Phase 8)

## External Sources of Truth

- `README.md` — setup, usage, component table
- `plan.md` — roadmap, phased tasks, schema proposals

## Writing Tests

All test files co-locate with their source (`src/**/*.test.ts`). Vitest globals are enabled (`describe`, `it`, `expect` are auto-imported).

### Pure function test pattern

```ts
import { describe, it, expect } from "vitest";
import { myFn } from "./myFn";

describe("myFn", () => {
  it("does the thing", () => {
    expect(myFn(input)).toBe(expected);
  });
});
```

### Store test pattern

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useStore } from "./useStore";

beforeEach(() => {
  act(() => useStore.setState({ /* initial state */ }));
});

it("mutates state", () => {
  act(() => useStore.getState().someAction());
  expect(useStore.getState().someField).toBe(expected);
});
```
