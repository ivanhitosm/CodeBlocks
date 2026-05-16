import { str } from "../utils/str";

export default function Layout(props: Record<string, string | undefined>) {
  return (
    <div className="flex min-h-[80px] items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-400">
      {str(props.label, "Layout container")}
    </div>
  );
}
