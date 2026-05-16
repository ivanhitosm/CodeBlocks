import { str } from "../utils/str";

export default function Text(props: Record<string, string | undefined>) {
  const content = str(props.title || props.description || props.label, "Text");
  return <p className="text-sm text-gray-800">{content}</p>;
}
