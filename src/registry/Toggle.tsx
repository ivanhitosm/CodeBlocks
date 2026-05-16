import { str } from "../utils/str";

export default function Toggle(props: Record<string, string | undefined>) {
  const on = props.checked === "true";
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <div
        className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${on ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <div
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`}
        />
      </div>
      {str(props.label, "Toggle")}
    </label>
  );
}
