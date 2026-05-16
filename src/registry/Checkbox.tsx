import { str } from "../utils/str";

export default function Checkbox(props: Record<string, string | undefined>) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-blue-600"
        defaultChecked={props.checked === "true"}
        disabled={props.disabled === "true"}
      />
      {str(props.label, "Checkbox")}
    </label>
  );
}
