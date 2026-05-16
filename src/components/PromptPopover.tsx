import { useState, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { useStore } from "../store/useStore";
import { fetchModels, generateBlockStream } from "../services/ollama";
import { parseAndValidate } from "../services/ollama";
import type { OllamaModel, StreamCallbacks } from "../services/ollama";
import { deriveCatalog } from "../utils/deriveCatalog";
import { deriveCode } from "../utils/deriveCode";
import type { Block, CatalogEntry, GenerationEvent, UIJSON } from "../types";

type Props = {
  x: number;
  y: number;
  mode: "block" | "logic" | "catalog" | "redo";
  blockId?: string;
  onClose: () => void;
};

function clampToViewport(x: number, y: number, w: number, h: number) {
  const headerBottom = 44;
  return {
    x: Math.max(2, Math.min(x, window.innerWidth - w - 2)),
    y: Math.max(headerBottom, Math.min(y, window.innerHeight - h - 2)),
  };
}

function uiJsonToEntry(ui: UIJSON, sourceBlockId?: string): CatalogEntry {
  return {
    id: uuid(),
    name: ui.type.charAt(0).toUpperCase() + ui.type.slice(1),
    tags: [ui.type],
    ui,
    createdAt: Date.now(),
    sourceBlockId,
    composite: ui.type === "layout",
  };
}

export default function PromptPopover({ x, y, mode, blockId, onClose }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);
  const selectedModel = useStore((s) => s.selectedModel);
  const setModel = useStore((s) => s.setModel);
  const addBlock = useStore((s) => s.addBlock);
  const updateBlock = useStore((s) => s.updateBlock);
  const addCatalogEntry = useStore((s) => s.addCatalogEntry);
  const addGenerationEvent = useStore((s) => s.addGenerationEvent);
  const setStreaming = useStore((s) => s.setStreaming);
  const appendStreaming = useStore((s) => s.appendStreaming);
  const clearStreaming = useStore((s) => s.clearStreaming);
  const streamingText = useStore((s) => s.streamingText);
  const isStreaming = useStore((s) => s.isStreaming);
  const blocks = useStore((s) => s.blocks);
  const catalogEntries = useStore((s) => s.catalogEntries);
  const existingBlock = mode === "redo" && blockId ? blocks[blockId] : undefined;

  useEffect(() => {
    fetchModels()
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  function makeEvent(overrides: Partial<GenerationEvent>): GenerationEvent {
    return {
      id: uuid(),
      timestamp: Date.now(),
      type: "system",
      content: "",
      blockId,
      ...overrides,
    };
  }

  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingText]);

  function handleBlockResult(ui: UIJSON) {
    addGenerationEvent(
      makeEvent({
        type: "response",
        content: JSON.stringify(ui, null, 2),
        metadata: { type: ui.type },
      })
    );

    if (mode === "redo" && blockId && existingBlock) {
      if (ui.layout) {
        ui.layout.x = existingBlock.position.x;
        ui.layout.y = existingBlock.position.y;
      }
        updateBlock(blockId, {
          ui_json: ui,
          size: { w: ui.layout?.w ?? 200, h: ui.layout?.h ?? 160 },
          catalog_json: deriveCatalog(ui),
          static_code: deriveCode(ui),
      });
      addGenerationEvent(
        makeEvent({ type: "system", content: `Block ${blockId.slice(0, 6)} updated with new UI` })
      );
    } else if (mode === "catalog") {
      addCatalogEntry(uiJsonToEntry(ui, blockId));
      addGenerationEvent(
        makeEvent({ type: "system", content: `Catalog entry "${ui.type}" added` })
      );
    } else {
      const bw = ui.layout?.w ?? 200;
      const bh = ui.layout?.h ?? 160;
      const clamped = clampToViewport(x, y, bw, bh);
      if (ui.layout) {
        ui.layout.x = clamped.x;
        ui.layout.y = clamped.y;
      }

        const block: Block = {
          id: uuid(),
          position: clamped,
          size: { w: bw, h: bh },
          ui_json: ui,
          catalog_json: deriveCatalog(ui),
          static_code: deriveCode(ui),
      };

      addBlock(block);
      addGenerationEvent(
        makeEvent({
          blockId: block.id,
          type: "system",
          content: `Block created: ${ui.type} (${block.id.slice(0, 6)})`,
        })
      );
    }
  }

  const handleSubmit = () => {
    if (!prompt.trim() || isStreaming) return;
    setLoading(true);
    setError("");

    addGenerationEvent(
      makeEvent({
        type: "prompt",
        content: `[${mode}] ${prompt.trim()}`,
        metadata: { model: selectedModel },
      })
    );

    setStreaming("");

    const callbacks: StreamCallbacks = {
      onToken: (token) => appendStreaming(token),
      onDone: (fullText) => {
        try {
          const ui = parseAndValidate(fullText);
          handleBlockResult(ui);
          clearStreaming();
          onClose();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Parse failed");
          addGenerationEvent(
            makeEvent({ type: "error", content: e instanceof Error ? e.message : "Parse failed" })
          );
        } finally {
          setLoading(false);
        }
      },
      onError: (e) => {
        setError(e.message);
        addGenerationEvent(makeEvent({ type: "error", content: e.message }));
        clearStreaming();
        setLoading(false);
      },
    };

    abortRef.current = generateBlockStream(prompt.trim(), selectedModel, catalogEntries, callbacks);
  };

  function handleCancel() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    clearStreaming();
    setLoading(false);
  }

  return (
    <div
      className="fixed z-50"
      style={{ left: x, top: y }}
    >
      <div className="w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        {models.length > 0 && (
          <select
            className="mb-2 w-full rounded border border-gray-200 px-2 py-1 text-xs"
            value={selectedModel}
            onChange={(e) => setModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        )}

        {existingBlock && (
          <p className="mb-1.5 text-xs text-gray-500">
            Modifying <span className="font-medium text-gray-700">{existingBlock.ui_json.type}</span> block
          </p>
        )}
        <textarea
          className="mb-2 w-full resize-none rounded border border-gray-200 p-2 text-sm focus:border-blue-400 focus:outline-none"
          rows={3}
          placeholder={mode === "redo" ? "Describe the changes..." : mode === "logic" ? "Describe the logic block (e.g. math, filter, merge)..." : "Describe the UI block..."}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          autoFocus
        />

        {isStreaming && streamingText && (
          <div className="mb-2 max-h-32 overflow-y-auto rounded border border-gray-100 bg-gray-50 p-2 text-[11px] font-mono text-gray-600">
            {streamingText}
            <span className="inline-block h-3 w-1.5 animate-pulse bg-blue-500" />
            <div ref={streamEndRef} />
          </div>
        )}

        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

        <div className="flex gap-2">
          {isStreaming ? (
            <button
              className="flex-1 rounded bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              onClick={handleCancel}
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
              >
                {loading ? "Generating..." : "Generate"}
              </button>
              <button
                className="rounded border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                onClick={onClose}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
