import { useState } from "react";
import { useStore } from "../store/useStore";
import { COMPONENTS } from "../registry";
import type { CatalogEntry, UIJSON } from "../types";

const PREVIEW_COLORS: Record<string, string> = {
  button: "bg-blue-500",
  input: "bg-white border border-gray-300",
  card: "bg-white border border-gray-200",
  heading: "bg-transparent",
  text: "bg-transparent",
  paragraph: "bg-transparent",
  image: "bg-gray-100",
  divider: "bg-gray-200",
  badge: "bg-yellow-400",
  alert: "bg-red-100",
  progress: "bg-green-400",
  list: "bg-white border border-gray-200",
  link: "bg-transparent",
  layout: "bg-gray-50 border border-dashed border-gray-300",
};

function MiniPreview({ ui }: { ui: UIJSON }) {
  const color = PREVIEW_COLORS[ui.type] ?? "bg-gray-100";
  const label = ui.type.charAt(0).toUpperCase() + ui.type.slice(1);
  const title = ui.props?.title ?? ui.props?.label ?? "";

  if (ui.children) {
    return (
      <div className={`flex flex-col gap-0.5 rounded p-1 ${color}`} style={{ minHeight: 40 }}>
        <span className="text-[8px] font-medium text-gray-500">{label}</span>
        <div className="flex flex-col gap-0.5 pl-1">
          {ui.children.slice(0, 3).map((child, i) => (
            <MiniPreview key={i} ui={child} />
          ))}
          {ui.children.length > 3 && (
            <span className="text-[7px] text-gray-400">+{ui.children.length - 3} more</span>
          )}
        </div>
      </div>
    );
  }

  switch (ui.type) {
    case "button":
      return (
        <div className="flex h-6 items-center justify-center rounded bg-blue-500 px-2 text-[9px] font-medium text-white">
          {title || "Button"}
        </div>
      );
    case "input":
      return (
        <div className="h-6 rounded border border-gray-300 bg-white px-1.5 text-[8px] leading-6 text-gray-400">
          {title || "Input..."}
        </div>
      );
    case "card":
      return (
        <div className="rounded border border-gray-200 bg-white" style={{ minHeight: 36 }}>
          {title && <div className="border-b border-gray-100 px-1.5 py-0.5 text-[8px] font-medium text-gray-700">{title}</div>}
          <div className="p-1 text-[7px] text-gray-400">Card content</div>
        </div>
      );
    case "heading":
      return <div className="text-[10px] font-bold text-gray-800">{title || "Heading"}</div>;
    case "text":
    case "paragraph":
      return <div className="text-[8px] leading-tight text-gray-600">{title || "Text content"}</div>;
    case "image":
      return (
        <div className="flex h-8 items-center justify-center rounded bg-gray-100 text-[8px] text-gray-400">
          {title || "Image"}
        </div>
      );
    case "divider":
      return <div className="h-px bg-gray-200" />;
    case "badge":
      return (
        <div className="inline-block rounded-full bg-yellow-400 px-1.5 text-[8px] font-medium text-yellow-900">
          {title || "Badge"}
        </div>
      );
    case "alert":
      return (
        <div className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[8px] text-red-700">
          {title || "Alert message"}
        </div>
      );
    case "progress":
      return (
        <div className="h-2 rounded-full bg-gray-200">
          <div className="h-2 w-2/3 rounded-full bg-green-400" />
        </div>
      );
    case "list":
      return (
        <div className="space-y-0.5 rounded border border-gray-200 bg-white p-1" style={{ minHeight: 30 }}>
          <div className="h-1.5 w-3/4 rounded bg-gray-100" />
          <div className="h-1.5 w-1/2 rounded bg-gray-100" />
          <div className="h-1.5 w-5/6 rounded bg-gray-100" />
        </div>
      );
    case "link":
      return <div className="text-[8px] text-blue-600 underline">{title || "Link"}</div>;
    default:
      return (
        <div className={`flex h-6 items-center justify-center rounded ${color} text-[8px] text-gray-500`}>
          {label}
        </div>
      );
  }
}

type Props = {
  onClose: () => void;
  onDrop: (e: React.DragEvent) => void;
};

function CatalogEntryCard({ entry, onDelete }: { entry: CatalogEntry; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", JSON.stringify(entry.ui));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <div
          className="h-10 w-16 shrink-0 overflow-hidden rounded border border-gray-100 bg-white cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={handleDragStart}
        >
          <MiniPreview ui={entry.ui} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {entry.name}
            {entry.composite && <span className="ml-1 font-normal text-blue-400">(composite)</span>}
          </span>
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-0.5 flex gap-1">
              {entry.tags.map((t) => (
                <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        {onDelete && (
          <span
            className="ml-auto cursor-pointer p-0.5 text-gray-300 hover:text-red-500"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-2 border-t border-gray-100 px-3 pb-3 pt-2">
          {entry.description && (
            <p className="text-xs text-gray-500">{entry.description}</p>
          )}
          <div>
            <span className="mb-1 block text-xs font-medium text-gray-500">UI JSON</span>
            <pre className="overflow-auto rounded bg-gray-900 p-3 text-xs text-green-300">
              {JSON.stringify(entry.ui, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

type CatalogGroupItem = {
  key: string;
  name: string;
  tags: string[];
  description?: string;
  entry: CatalogEntry;
  onDelete?: () => void;
};

export default function CatalogPanel({ onClose, onDrop }: Props) {
  const catalogEntries = useStore((s) => s.catalogEntries);
  const removeCatalogEntry = useStore((s) => s.removeCatalogEntry);
  const [search, setSearch] = useState("");

  const builtInItems: CatalogGroupItem[] = COMPONENTS.map((c) => ({
    key: c.type,
    name: c.name,
    tags: [c.type],
    description: `Built-in component`,
    entry: {
      id: c.type,
      name: c.name,
      tags: [c.type],
      ui: c.example as CatalogEntry["ui"],
      createdAt: 0,
      composite: c.composite,
    },
  }));

  const userItems: CatalogGroupItem[] = catalogEntries.map((e) => ({
    key: `user-${e.id}`,
    name: e.name,
    tags: e.tags ?? [],
    description: e.description,
    entry: e,
    onDelete: () => removeCatalogEntry(e.id),
  }));

  const allItems = [...builtInItems, ...userItems];

  const filtered = search.trim()
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : allItems;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Block Catalog</h2>
          <div className="flex items-center gap-2">
            <input
              className="h-7 rounded border border-gray-200 px-2 text-[11px] outline-none focus:border-blue-400"
              placeholder="Search by name or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" onClick={onClose}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {filtered.length === 0 && (
            <p className="mt-8 text-center text-xs text-gray-400">
              {search ? "No matching components." : "No catalog entries yet."}
            </p>
          )}
          {filtered.map((item) => (
            <CatalogEntryCard key={item.key} entry={item.entry} onDelete={item.onDelete} />
          ))}
        </div>
      </div>
    </>
  );
}
