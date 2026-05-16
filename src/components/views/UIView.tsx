import { registry } from "../../registry";
import type { UIJSON } from "../../types";

type Props = { ui: UIJSON };

function ChildView({ ui }: Props) {
  const Component = registry[ui.type];
  if (!Component) return <div className="p-1 text-xs text-red-500">Unknown: {ui.type}</div>;
  return <Component {...(ui.props as Record<string, string>)} />;
}

export default function UIView({ ui }: Props) {
  if (ui.children && ui.children.length > 0) {
    return (
      <div className="flex h-full w-full flex-col gap-2 overflow-auto p-2">
        {ui.children.map((child, i) => (
          <ChildView key={i} ui={child} />
        ))}
      </div>
    );
  }

  const Component = registry[ui.type];
  if (!Component) return <div className="p-2 text-red-500">Unknown type: {ui.type}</div>;
  return (
    <div className="h-full w-full overflow-auto p-2">
      <Component {...(ui.props as Record<string, string>)} />
    </div>
  );
}
