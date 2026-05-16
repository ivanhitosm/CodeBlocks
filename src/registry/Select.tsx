import { str } from "../utils/str";

export default function Select(props: Record<string, string | undefined>) {
  const label = str(props.label);
  const raw = props.options ?? "Option 1,Option 2,Option 3";
  const rawOptions = Array.isArray(raw) ? raw : String(raw).split(",");
  const options = rawOptions.map(String);
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-gray-700">{label}</label>}
      <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
        {options.map((o, i) => (
          <option key={`${o}-${i}`} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
