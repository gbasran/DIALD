// PLACEHOLDER: All focus time data is hardcoded demo data
const demoHourly = [0, 0, 15, 45, 30, 0, 22, 15, 0, 0, 0, 0];

export function FocusTimePanel() {
  // PLACEHOLDER: Hardcoded daily focus minutes and weekly goal
  const goalPct = Math.min(Math.round((127 / 150) * 100), 100);
  const maxH = Math.max(...demoHourly, 1);

  return (
    <div className="glass glow-border rounded-xl p-3.5 flex flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Focus Time</p>
      <div className="flex items-end justify-between mb-2">
        <div>
          {/* PLACEHOLDER: Hardcoded focus minutes */}
          <p className="font-heading text-2xl font-bold leading-none">127<span className="text-sm font-normal text-muted-foreground">m</span></p>
          <p className="text-[10px] text-muted-foreground/60">today</p>
        </div>
        <div className="text-right">
          {/* PLACEHOLDER: Hardcoded weekly total */}
          <p className="text-xs font-medium">8h 5m</p>
          <p className="text-[10px] text-muted-foreground/60">this week</p>
        </div>
      </div>
      {/* Goal bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="text-muted-foreground/60">Daily goal</span>
          <span className="font-medium">{goalPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div className="h-full rounded-full bg-[hsl(var(--focus-purple))] transition-all" style={{ width: `${goalPct}%` }} />
        </div>
      </div>
      {/* Mini chart */}
      <div className="flex items-end gap-0.5 flex-1 min-h-[32px]">
        {demoHourly.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-[hsl(var(--focus-purple))]/40"
            style={{ height: `${Math.max((val / maxH) * 100, 4)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-0.5">
        <span>8am</span><span>12pm</span><span>4pm</span><span>8pm</span>
      </div>
    </div>
  );
}
