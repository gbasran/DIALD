'use client';

import { useFocusSessions } from '@/hooks/use-focus-sessions';

export function FocusTimePanel() {
  const { todayMinutes, weeklyTotal, dailyGoalMinutes, goalProgress, hourlyDistribution, isLoaded } = useFocusSessions();

  const minutes = isLoaded ? todayMinutes : 0;
  const weekly = isLoaded ? weeklyTotal : 0;
  const goal = isLoaded ? dailyGoalMinutes : 150;
  const goalPct = isLoaded ? goalProgress : 0;
  const hourly = isLoaded ? hourlyDistribution : new Array(12).fill(0);

  const weeklyHours = Math.floor(weekly / 60);
  const weeklyMins = weekly % 60;
  const weeklyLabel = `${weeklyHours}h ${weeklyMins}m`;

  const maxH = Math.max(...hourly, 1);

  return (
    <div className="glass glow-border rounded-xl p-3.5 flex flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Focus Time</p>
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="font-heading text-2xl font-bold leading-none">{minutes}<span className="text-sm font-normal text-muted-foreground">m</span></p>
          <p className="text-[10px] text-muted-foreground/60">today</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium">{weeklyLabel}</p>
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
        {hourly.map((val, i) => (
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
