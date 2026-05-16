import { str } from "../utils/str";

const BADGE_COLORS: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  red: "bg-red-100 text-red-700",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  purple: "bg-purple-100 text-purple-700",
};

export default function Badge(props: Record<string, string | undefined>) {
  const color = BADGE_COLORS[str(props.color)] ?? BADGE_COLORS.default;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {str(props.label, "Badge")}
    </span>
  );
}
