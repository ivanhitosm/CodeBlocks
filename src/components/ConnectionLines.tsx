import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { useStore } from "../store/useStore";
import { getPorts, canConnect } from "../utils/portDefinitions";
import { getDataValueForConnection } from "../utils/runtime";
import { PORT_SPACING, HEADER_HEIGHT, bezierPath } from "../utils/connection";
import type { Connection, RuntimeValue } from "../types";

type DragState = {
  sourceBlockId: string;
  sourcePortId: string;
  sourcePortType: string;
  mouseX: number;
  mouseY: number;
};

type Props = {
  zoom: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

function getPortPosition(
  blockId: string,
  portId: string,
  direction: "input" | "output",
): { x: number; y: number } | null {
  const blocks = useStore.getState().blocks;
  const block = blocks[blockId];
  if (!block) return null;
  const ports = getPorts(block.ui_json.type, block.ui_json.children);
  const filtered = ports.filter((p) => p.direction === direction);
  const idx = filtered.findIndex((p) => p.id === portId);
  if (idx < 0) return null;
  const y = block.position.y + HEADER_HEIGHT + PORT_SPACING * (idx + 1);
  const x = direction === "input" ? block.position.x : block.position.x + block.size.w;
  return { x, y };
}

export default function ConnectionLines({ zoom, containerRef }: Props) {
  const connections = useStore((s) => s.connections);
  const runtimeResults = useStore((s) => s.runtimeResults);
  const addConnection = useStore((s) => s.addConnection);
  const removeConnection = useStore((s) => s.removeConnection);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoveredConn, setHoveredConn] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateRect = () => {
      setContainerRect(container.getBoundingClientRect());
    };
    updateRect();

    const handlePortMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const portEl = target.closest("[data-port][data-port-direction='output']") as HTMLElement | null;
      if (!portEl) return;
      e.stopPropagation();
      const blockId = portEl.getAttribute("data-block-id");
      const portId = portEl.getAttribute("data-port");
      const portType = portEl.getAttribute("data-port-type") ?? "any";
      if (!blockId || !portId) return;
      updateRect();
      setDrag({
        sourceBlockId: blockId,
        sourcePortId: portId,
        sourcePortType: portType,
        mouseX: e.clientX,
        mouseY: e.clientY,
      });
    };

    container.addEventListener("mousedown", handlePortMouseDown);
    window.addEventListener("resize", updateRect);
    return () => {
      container.removeEventListener("mousedown", handlePortMouseDown);
      window.removeEventListener("resize", updateRect);
    };
  }, [containerRef]);

  useEffect(() => {
    if (!drag) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDrag((d) => d ? { ...d, mouseX: e.clientX, mouseY: e.clientY } : null);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const portEl = target?.closest("[data-port][data-port-direction='input']") as HTMLElement | null;
      if (portEl) {
        const targetBlockId = portEl.getAttribute("data-block-id");
        const targetPortId = portEl.getAttribute("data-port");
        const targetPortType = portEl.getAttribute("data-port-type") ?? "any";
        if (targetBlockId && targetPortId && targetBlockId !== d.sourceBlockId) {
          if (canConnect(d.sourcePortType, targetPortType)) {
            const exists = connections.some(
              (c) =>
                c.sourceBlockId === d.sourceBlockId &&
                c.sourcePortId === d.sourcePortId &&
                c.targetBlockId === targetBlockId &&
                c.targetPortId === targetPortId
            );
            if (!exists) {
              const conn: Connection = {
                id: uuid(),
                sourceBlockId: d.sourceBlockId,
                sourcePortId: d.sourcePortId,
                targetBlockId,
                targetPortId,
              };
              addConnection(conn);
            }
          }
        }
      }
      setDrag(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [drag, connections, addConnection]);

  function getPortPos(blockId: string, portId: string, direction: "input" | "output") {
    return getPortPosition(blockId, portId, direction);
  }



  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20"
      style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const src = getPortPos(conn.sourceBlockId, conn.sourcePortId, "output");
        const tgt = getPortPos(conn.targetBlockId, conn.targetPortId, "input");
        if (!src || !tgt) return null;
        const isHovered = hoveredConn === conn.id;
        const dataValue: RuntimeValue = runtimeResults[conn.sourceBlockId]
          ? getDataValueForConnection(conn, runtimeResults)
          : null;
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        return (
          <g key={conn.id}>
            <path
              d={bezierPath(src.x, src.y, tgt.x, tgt.y)}
              fill="none"
              stroke={isHovered ? "#ef4444" : "#3b82f6"}
              strokeWidth={isHovered ? 3 : 2}
              strokeOpacity={isHovered ? 1 : 0.7}
              markerEnd="url(#arrowhead)"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredConn(conn.id)}
              onMouseLeave={() => setHoveredConn(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (isHovered) {
                  removeConnection(conn.id);
                }
              }}
            />
            {dataValue !== null && (
              <g className="pointer-events-none">
                <rect
                  x={mx - 30}
                  y={my - 10}
                  width={60}
                  height={16}
                  rx={4}
                  fill="white"
                  fillOpacity={0.85}
                  stroke="#d1d5db"
                  strokeWidth={0.5}
                />
                <text
                  x={mx}
                  y={my + 1}
                  textAnchor="middle"
                  className="fill-purple-700 text-[9px]"
                >
                  {String(dataValue).length > 12
                    ? String(dataValue).slice(0, 12) + "…"
                    : String(dataValue)}
                </text>
              </g>
            )}
            {isHovered && (
              <text
                x={mx}
                y={my - 12}
                textAnchor="middle"
                className="fill-red-500 text-[10px]"
              >
                Click to remove
              </text>
            )}
          </g>
        );
      })}
      {drag && containerRect && (() => {
        const src = getPortPos(drag.sourceBlockId, drag.sourcePortId, "output");
        if (!src) return null;
        const mx = (drag.mouseX - containerRect.left) / zoom;
        const my = (drag.mouseY - containerRect.top) / zoom;
        return (
          <path
            d={bezierPath(src.x, src.y, mx, my)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="6 3"
            strokeOpacity={0.6}
          />
        );
      })()}
    </svg>
  );
}