import { useState } from "react";
import { useStore } from "../store/useStore";
import type { GenerationEvent } from "../types";

const TYPE_COLORS: Record<GenerationEvent["type"], string> = {
  prompt: "text-blue-600 bg-blue-50",
  response: "text-green-600 bg-green-50",
  validation: "text-yellow-600 bg-yellow-50",
  repair: "text-purple-600 bg-purple-50",
  error: "text-red-600 bg-red-50",
  system: "text-gray-600 bg-gray-50",
};

const TYPE_LABELS: Record<GenerationEvent["type"], string> = {
  prompt: "PROMPT",
  response: "RESPONSE",
  validation: "VALIDATE",
  repair: "REPAIR",
  error: "ERROR",
  system: "SYSTEM",
};

function EventRow({ event }: { event: GenerationEvent }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = event.content.length > 120;
  const time = new Date(event.timestamp).toLocaleTimeString();
  return (
    <div className="border-b border-gray-100 py-1 text-[11px] leading-relaxed">
      <div className="flex items-start gap-2">
        <span className="shrink-0 font-mono text-gray-400">{time}</span>
        <span
          className={`shrink-0 rounded px-1 font-medium ${TYPE_COLORS[event.type]}`}
        >
          {TYPE_LABELS[event.type]}
        </span>
        {event.blockId && (
          <span className="shrink-0 font-mono text-gray-400">
            [{event.blockId.slice(0, 6)}]
          </span>
        )}
        <span className="min-w-0 flex-1 break-all text-gray-700">
          {expanded || !isLong
            ? event.content
            : `${event.content.slice(0, 120)}...`}
        </span>
        {isLong && (
          <button
            className="shrink-0 text-blue-500 hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "less" : "more"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function GenerationConsole() {
  const generationLog = useStore((s) => s.generationLog);
  const clearGenerationLog = useStore((s) => s.clearGenerationLog);
  const streamingText = useStore((s) => s.streamingText);
  const isStreaming = useStore((s) => s.isStreaming);
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups: Record<string, GenerationEvent[]> = {};
  for (const ev of generationLog) {
    const key = ev.blockId ?? "__ungrouped__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  }

  const blockNames = useStore((s) => s.blocks);
  function groupLabel(key: string): string {
    if (key === "__ungrouped__") return "Unattached";
    const block = blockNames[key];
    const name = block ? block.ui_json.type : key.slice(0, 6);
    return `${name} (${groups[key].length})`;
  }

  const visibleKeys = Object.keys(groups).filter((key) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return groups[key].some(
      (ev) =>
        ev.content.toLowerCase().includes(q) ||
        ev.type.toLowerCase().includes(q)
    );
  });

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-1.5">
        <span className="text-xs font-semibold text-gray-600">
          Console ({generationLog.length})
        </span>
        <input
          className="ml-2 h-6 min-w-0 flex-1 rounded border border-gray-300 px-2 text-[11px] outline-none focus:border-blue-400"
          placeholder="Filter by text or type..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          className="rounded px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:bg-gray-200"
          onClick={clearGenerationLog}
        >
          Clear
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
        {isStreaming && (
          <div className="mb-2 rounded border border-blue-100 bg-blue-50 px-2 py-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-700">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              Streaming...
            </div>
            {streamingText && (
              <div className="mt-1 max-h-24 overflow-y-auto text-[10px] font-mono text-blue-600">
                {streamingText}
              </div>
            )}
          </div>
        )}

        {visibleKeys.length === 0 && !isStreaming && (
          <p className="mt-4 text-center text-xs text-gray-400">
            {generationLog.length === 0
              ? "No generation events yet. Create a block to see logs."
              : "No matching events."}
          </p>
        )}
        {visibleKeys.map((key) => (
          <div key={key} className="mb-2">
            <button
              className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
              onClick={() => toggleGroup(key)}
            >
              <span className="text-gray-400">
                {collapsed.has(key) ? "▶" : "▼"}
              </span>
              {groupLabel(key)}
            </button>
            {!collapsed.has(key) && (
              <div className="ml-3">
                {groups[key].map((ev) => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
