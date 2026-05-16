type Props = { code: string };

export default function CodeView({ code }: Props) {
  return (
    <pre className="h-full w-full overflow-auto p-2 text-xs text-gray-800 font-mono whitespace-pre">
      {code}
    </pre>
  );
}
