'use client';

import { Flame } from 'lucide-react';
import { useFocusSessions } from '@/hooks/use-focus-sessions';

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StudyStreak() {
  const { streak, isLoaded } = useFocusSessions();
  const weekDots = isLoaded ? streak.weekDots : Array(7).fill(false);
  const currentStreak = isLoaded ? streak.current : 0;
  const bestStreak = isLoaded ? streak.best : 0;

  return (
    <div className="glass glow-border rounded-xl p-3.5 flex flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Study Streak</p>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="rounded-lg bg-[hsl(var(--warning))]/15 p-2">
          <Flame className="h-5 w-5 text-[hsl(var(--warning))]" />
        </div>
        <div>
          <p className="font-heading text-2xl font-bold leading-none">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground/60">day streak</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 flex-1">
        {weekDots.map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <div className={`h-6 w-full rounded-md ${active ? 'bg-primary' : 'bg-muted/40'}`} />
            <span className="text-[9px] text-muted-foreground/50">{dayLabels[i]}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground/50">Best: <span className="font-medium text-foreground">{bestStreak} {bestStreak === 1 ? 'day' : 'days'}</span></p>
    </div>
  );
}
