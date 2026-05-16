import type { CatalogJSON } from "../../types";

type Props = { catalog: CatalogJSON };

function TreeNode({ node, props, children }: CatalogJSON, depth = 0) {
  const indent = depth * 16;
  return (
    <div>
      <div
        className="flex items-center gap-1 text-xs font-mono"
        style={{ paddingLeft: indent }}
      >
        <span className="text-blue-600">&lt;{node}&gt;</span>
        {props && Object.keys(props).length > 0 && (
          <span className="text-gray-500">
            {JSON.stringify(props)}
          </span>
        )}
      </div>
      {children?.map((child, i) => (
        <div key={i}>{TreeNode(child, depth + 1)}</div>
      ))}
      {children && (
        <div
          className="text-xs font-mono text-blue-600"
          style={{ paddingLeft: indent }}
        >
          &lt;/{node}&gt;
        </div>
      )}
    </div>
  );
}

export default function CatalogView({ catalog }: Props) {
  return (
    <div className="h-full w-full overflow-auto p-2">
      {TreeNode(catalog)}
    </div>
  );
}
