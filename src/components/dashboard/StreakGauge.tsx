import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface StreakGaugeProps {
  currentStreak: number;
  bestStreak: number;
  weekData: boolean[];
  className?: string;
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakGauge({ currentStreak, bestStreak, weekData, className }: StreakGaugeProps) {
  return (
    <Card className={cn('animate-card-enter', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Study Streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[hsl(var(--warning))]/15 p-2.5">
            <Flame className="h-6 w-6 text-[hsl(var(--warning))]" />
          </div>
          <div>
            <p className="font-heading text-3xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          {weekData.map((active, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-md transition-colors',
                  active
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
              <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Best: <span className="font-medium text-foreground">{bestStreak} days</span>
        </p>
      </CardContent>
    </Card>
  );
}
