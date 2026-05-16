import { str } from "../utils/str";

const COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"];

export default function Avatar(props: Record<string, string | undefined>) {
  const nameStr = String(props.name ?? "U");
  const src = str(props.src);
  const colorIdx = (nameStr.length ?? 0) % COLORS.length;
  const initials = nameStr
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const size = Number(props.size) || 36;

  if (src) {
    return (
      <img
        src={String(props.src)}
        alt={nameStr}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-xs font-medium text-white ${COLORS[colorIdx]}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
