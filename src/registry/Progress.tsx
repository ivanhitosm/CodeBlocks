import { str } from "../utils/str";

export default function Progress(props: Record<string, string | undefined>) {
  const label = str(props.label, "Progress");
  const value = Math.min(100, Math.max(0, Number(props.value ?? 60)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>{isNaN(value) ? 0 : value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${isNaN(value) ? 0 : value}%` }}
        />
      </div>
    </div>
  );
}
