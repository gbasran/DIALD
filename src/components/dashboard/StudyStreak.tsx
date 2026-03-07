import { Flame } from 'lucide-react';

// PLACEHOLDER: All streak data is hardcoded demo data
const demoWeek = [true, true, true, false, true, true, true];
const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StudyStreak() {
  return (
    <div className="glass glow-border rounded-xl p-3.5 flex flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Study Streak</p>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="rounded-lg bg-[hsl(var(--warning))]/15 p-2">
          <Flame className="h-5 w-5 text-[hsl(var(--warning))]" />
        </div>
        <div>
          {/* PLACEHOLDER: Hardcoded streak count */}
          <p className="font-heading text-2xl font-bold leading-none">7</p>
          <p className="text-[10px] text-muted-foreground/60">day streak</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 flex-1">
        {demoWeek.map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <div className={`h-6 w-full rounded-md ${active ? 'bg-primary' : 'bg-muted/40'}`} />
            <span className="text-[9px] text-muted-foreground/50">{dayLabels[i]}</span>
          </div>
        ))}
      </div>
      {/* PLACEHOLDER: Hardcoded best streak */}
      <p className="mt-2 text-[10px] text-muted-foreground/50">Best: <span className="font-medium text-foreground">14 days</span></p>
    </div>
  );
}
