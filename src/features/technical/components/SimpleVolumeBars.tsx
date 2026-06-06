import type { PricePoint } from "../types";

type SimpleVolumeBarsProps = {
  points: PricePoint[];
  title: string;
};

export function SimpleVolumeBars({ points, title }: SimpleVolumeBarsProps) {
  const maxVolume = Math.max(1, ...points.map((point) => point.volume));

  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <p className="mb-3 text-sm font-bold text-ink">{title}</p>
      <div className="flex h-28 items-end gap-1 border-b border-border-soft pb-2">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-[3px] bg-accent"
              style={{ height: `${Math.max(8, (point.volume / maxVolume) * 100)}%` }}
            />
            <span className="text-[10px] text-subtle">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
