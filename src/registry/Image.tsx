export default function Image(props: Record<string, string | undefined>) {
  return (
    <div className="flex items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50">
      <img
        src={String(props.src ?? "https://placehold.co/400x200/e5e7eb/9ca3af?text=Image")}
        alt={String(props.alt ?? "Image")}
        className="max-h-full max-w-full object-contain"
        style={{ width: props.width ? Number(props.width) : undefined, height: props.height ? Number(props.height) : undefined }}
      />
    </div>
  );
}
