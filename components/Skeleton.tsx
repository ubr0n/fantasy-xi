export function Skeleton({
  width,
  height,
  style,
}: {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton rounded-lg"
      style={{ width: width || "100%", height: height || 16, ...style }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-6">
      <Skeleton height={12} width="60%" />
      <Skeleton height={40} width="80%" />
      <Skeleton height={12} width="40%" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-(--border)"
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === 0 ? 32 : "100%"} />
      ))}
    </div>
  );
}
