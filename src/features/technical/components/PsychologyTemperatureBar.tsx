type PsychologyTemperatureBarProps = {
  states: string[];
  currentState: string;
  score: number;
};

export function PsychologyTemperatureBar({
  currentState,
  score,
  states,
}: PsychologyTemperatureBarProps) {
  return (
    <div className="rounded-[4px] border border-border-soft bg-surface px-3 py-3">
      <div className="relative h-4 rounded-full bg-surface-soft">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[10px] font-medium text-subtle">
        {states.map((state) => <span key={state}>{state}</span>)}
      </div>
      <p className="mt-3 text-sm font-bold text-ink">{currentState}</p>
    </div>
  );
}
