import type { UIJSON } from "../../types";

type Props = { ui: UIJSON };

export default function JsonView({ ui }: Props) {
  return (
    <pre className="h-full w-full overflow-auto p-2 text-xs text-gray-800">
      {JSON.stringify(ui, null, 2)}
    </pre>
  );
}
