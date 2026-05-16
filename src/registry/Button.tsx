import { str } from "../utils/str";

export default function Button(props: Record<string, string | undefined>) {
  return (
    <button
      type="button"
      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {str(props.label, "Button")}
    </button>
  );
}
