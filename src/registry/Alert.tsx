import { str } from "../utils/str";

const ALERT_COLORS: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

export default function Alert(props: Record<string, string | undefined>) {
  const variant = str(props.variant, "info");
  const color = ALERT_COLORS[variant] ?? ALERT_COLORS.info;
  const title = str(props.title);
  const description = str(props.description, "Alert message");
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${color}`}>
      {title && <p className="font-medium">{title}</p>}
      <p>{description}</p>
    </div>
  );
}
