import { str } from "../utils/str";

export default function Divider(props: Record<string, string | undefined>) {
  const label = str(props.label);
  if (label) {
    return (
      <div className="flex w-full items-center gap-2 text-xs text-gray-400">
        <span className="flex-1 border-t border-gray-200" />
        <span>{label}</span>
        <span className="flex-1 border-t border-gray-200" />
      </div>
    );
  }
  return <hr className="w-full border-gray-200" />;
}
