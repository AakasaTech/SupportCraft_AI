interface Props {
  rows:   number;
  cols:   number;
  height: number;
}

export function DashboardSkeleton({ rows, cols, height }: Props) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-muted"
          style={{ height }}
        />
      ))}
    </div>
  );
}
