import { useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import { useStore } from "../store/useStore";
import { getPorts, isLogicBlock } from "../utils/portDefinitions";
import type { Block, ViewTab } from "../types";
import BlockIdContext from "./BlockContext";
import UIView from "./views/UIView";
import JsonView from "./views/JsonView";
import CatalogView from "./views/CatalogView";
import CodeView from "./views/CodeView";

type Props = {
  block: Block;
  zoom?: number;
};

const TABS: { key: ViewTab; label: string }[] = [
  { key: "ui", label: "UI" },
  { key: "json", label: "JSON" },
  { key: "catalog", label: "CATALOG" },
  { key: "code", label: "CODE" },
];

export default function BlockView({ block, zoom = 1 }: Props) {
  const [tab, setTab] = useState<ViewTab>("ui");
  const [copied, setCopied] = useState(false);
  const updateBlock = useStore((s) => s.updateBlock);
  const setSelected = useStore((s) => s.setSelected);
  const selectedBlockIds = useStore((s) => s.selectedBlockIds);
  const isSelected = selectedBlockIds.includes(block.id);
  const ports = getPorts(block.ui_json.type, block.ui_json.children);
  const inputPorts = ports.filter((p) => p.direction === "input");
  const outputPorts = ports.filter((p) => p.direction === "output");
  const isLogic = isLogicBlock(block.ui_json.type);
  const runtimeResult = useStore((s) => s.runtimeResults[block.id]);
  const execStatus = runtimeResult?.status;

  function borderColor(): string {
    if (isSelected) return "border-blue-500";
    if (isLogic && execStatus === "success") return "border-green-400";
    if (isLogic && execStatus === "error") return "border-red-400";
    if (isLogic && execStatus === "running") return "border-blue-400";
    return "border-gray-200";
  }

  const handleDragStop = useCallback(
    (_: unknown, d: { x: number; y: number }) => {
      if (selectedBlockIds.length > 1) {
        const dx = d.x - block.position.x;
        const dy = d.y - block.position.y;
        const store = useStore.getState();
        for (const id of selectedBlockIds) {
          if (id === block.id) continue;
          const b = store.blocks[id];
          if (b) {
            store.updateBlock(id, { position: { x: b.position.x + dx, y: b.position.y + dy } });
          }
        }
      }
      updateBlock(block.id, { position: { x: d.x, y: d.y } });
    },
    [block.id, block.position.x, block.position.y, selectedBlockIds, updateBlock]
  );

  const handleResizeStop = useCallback(
    (_: unknown, __: unknown, ref: HTMLElement, ___: unknown, pos: { x: number; y: number }) => {
      updateBlock(block.id, {
        size: { w: ref.offsetWidth, h: ref.offsetHeight },
        position: { x: pos.x, y: pos.y },
      });
    },
    [block.id, updateBlock]
  );
  function getCopyContent(): string {
    switch (tab) {
      case "json":
        return JSON.stringify(block.ui_json, null, 2);
      case "catalog":
        return JSON.stringify(block.catalog_json, null, 2);
      case "code":
        return block.static_code;
      default:
        return "";
    }
  }

  async function handleCopy() {
    const content = getCopyContent();
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Rnd
      position={{ x: block.position.x, y: block.position.y }}
      size={{ width: block.size.w, height: block.size.h }}
      dragGrid={[24, 24]}
      resizeGrid={[24, 24]}
      scale={zoom}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      bounds="window"
      onMouseDown={() => setSelected(block.id)}
      className={`rounded-lg border-2 bg-white shadow-md ${borderColor()}`}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
      }}
      minWidth={240}
      minHeight={160}
    >
      <div data-block-id={block.id} className="relative flex h-full flex-col">
        <BlockIdContext.Provider value={block.id}>
        {outputPorts.map((port, i) => (
          <button
            key={port.id}
            data-port={port.id}
            data-port-direction="output"
            data-port-type={port.type}
            data-block-id={block.id}
            className="absolute right-0 z-10 flex h-4 w-4 -translate-y-1/2 translate-x-1/2 cursor-crosshair items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow hover:bg-blue-600"
            style={{ top: `${44 + 24 * (i + 1)}px` }}
            title={`${port.label} (${port.type})`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="sr-only">{port.label}</span>
          </button>
        ))}
        {inputPorts.map((port, i) => (
          <div
            key={port.id}
            data-port={port.id}
            data-port-direction="input"
            data-port-type={port.type}
            data-block-id={block.id}
            className="absolute left-0 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-green-500 shadow"
            style={{ top: `${44 + 24 * (i + 1)}px` }}
            title={`${port.label} (${port.type})`}
          />
        ))}
        <div className="flex shrink-0 items-center border-b border-gray-200 bg-gray-50 px-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`px-2 py-1 text-[11px] font-medium leading-none ${
                tab === t.key
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          {tab !== "ui" && (
            <button
              onClick={handleCopy}
              className="ml-auto px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-gray-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {tab === "ui" && <UIView ui={block.ui_json} />}
          {tab === "json" && <JsonView ui={block.ui_json} />}
          {tab === "catalog" && <CatalogView catalog={block.catalog_json} />}
          {tab === "code" && <CodeView code={block.static_code} />}
        </div>
        </BlockIdContext.Provider>
      </div>
    </Rnd>
  );
}
