import { str } from "../utils/str";

export default function Input(props: Record<string, string | undefined>) {
  const label = str(props.label);
  const placeholder = str(props.placeholder, "Enter text...");
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-gray-700">{label}</label>}
      <input
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        placeholder={placeholder}
        disabled={props.disabled === "true"}
      />
    </div>
  );
}
