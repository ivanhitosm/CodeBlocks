import { str } from "../utils/str";

export default function Card(props: Record<string, string | undefined>) {
  const title = str(props.title);
  const description = str(props.description);
  return (
    <div className="h-full w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {title && <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>}
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  );
}
