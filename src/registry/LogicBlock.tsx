import { str } from "../utils/str";
import { useStore } from "../store/useStore";
import { useBlockId } from "../components/BlockContext";

function statusColor(status: string | undefined): string {
  switch (status) {
    case "success": return "text-green-600";
    case "error": return "text-red-600";
    case "running": return "text-blue-600";
    default: return "text-gray-400";
  }
}

export function MathBlock(props: Record<string, string | undefined>) {
  return <LogicBlockView {...props} typeLabel="Math" />;
}

export function FilterBlock(props: Record<string, string | undefined>) {
  return <LogicBlockView {...props} typeLabel="Filter" />;
}

export function MergeBlock(props: Record<string, string | undefined>) {
  return <LogicBlockView {...props} typeLabel="Merge" />;
}

export function SwitchBlock(props: Record<string, string | undefined>) {
  return <LogicBlockView {...props} typeLabel="Switch" />;
}

export function TemplateBlock(props: Record<string, string | undefined>) {
  return <LogicBlockView {...props} typeLabel="Template" />;
}

export function HttpBlock(props: Record<string, string | undefined>) {
  return <LogicBlockView {...props} typeLabel="HTTP" />;
}

function LogicBlockView(props: Record<string, string | undefined> & { typeLabel?: string }) {
  const label = str(props.label, "");
  const operation = str(props.operation, "");
  const condition = str(props.condition, "");
  const cases = str(props.cases, "");
  const blockId = useBlockId();

  const runtimeResults = useStore((s) => s.runtimeResults);
  const result = blockId ? runtimeResults[blockId] : undefined;
  const status = result?.status ?? "idle";
  const error = result?.error;
  const outputs = result?.outputs ?? {};

  const typeLabel = str(props.typeLabel, "Logic");

  return (
    <div className="flex h-full flex-col gap-1 p-2 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
          {typeLabel}
        </span>
        {label && <span className="text-gray-500 truncate">{label}</span>}
        <span className={`ml-auto text-[10px] ${statusColor(status)}`}>
          {status === "idle" && "○ idle"}
          {status === "running" && "◌ running"}
          {status === "success" && "● success"}
          {status === "error" && "● error"}
        </span>
      </div>
      {operation && <div className="text-gray-400">op: {operation}</div>}
      {condition && <div className="text-gray-400">if: {condition}</div>}
      {cases && <div className="text-gray-400">cases: {cases}</div>}
      {error && <div className="text-red-500 break-words">Error: {error}</div>}
      {Object.keys(outputs).length > 0 && (
        <div className="mt-auto border-t border-gray-200 pt-1 text-gray-600">
          {Object.entries(outputs).map(([k, v]) => (
            <div key={k} className="truncate">
              <span className="text-purple-600">{k}</span>: {v === null ? "∅" : String(v)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
