type Props = {
  x: number;
  y: number;
  onCreateBlock: () => void;
  onCreateLogicBlock: () => void;
  onAddToCatalog: () => void;
  onClose: () => void;
};

export default function ContextMenu({ x, y, onCreateBlock, onCreateLogicBlock, onAddToCatalog, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
        style={{ left: x, top: y }}
      >
        <p className="mb-3 text-sm font-medium text-gray-700">What do you want to do?</p>
        <button
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={(e) => { e.stopPropagation(); onCreateBlock(); }}
        >
          Create UI Block
        </button>
        <button
          className="mt-1 w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          onClick={(e) => { e.stopPropagation(); onCreateLogicBlock(); }}
        >
          Create Logic Block
        </button>
        <button
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={(e) => { e.stopPropagation(); onAddToCatalog(); }}
        >
          Add to Catalog
        </button>
      </div>
    </>
  );
}
