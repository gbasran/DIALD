import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FocusTimeSummaryProps {
  todayMinutes: number;
  weekMinutes: number;
  goalMinutes: number;
  hourlyData: number[];
  className?: string;
}

export function FocusTimeSummary({
  todayMinutes,
  weekMinutes,
  goalMinutes,
  hourlyData,
  className,
}: FocusTimeSummaryProps) {
  const goalPercent = Math.min(Math.round((todayMinutes / goalMinutes) * 100), 100);

  return (
    <Card className={cn('animate-card-enter', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Focus Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-heading text-3xl font-bold">{todayMinutes}<span className="text-lg font-normal text-muted-foreground">m</span></p>
            <p className="text-xs text-muted-foreground">today</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{Math.round(weekMinutes / 60)}h {weekMinutes % 60}m</p>
            <p className="text-xs text-muted-foreground">this week</p>
          </div>
        </div>

        {/* Daily goal progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Daily goal</span>
            <span className="font-medium">{goalPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[hsl(var(--focus-purple))] transition-all duration-500"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end justify-between gap-1" style={{ height: '48px' }}>
          {hourlyData.map((val, i) => {
            const maxVal = Math.max(...hourlyData, 1);
            const height = Math.max((val / maxVal) * 100, 4);
            return (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-[hsl(var(--focus-purple))]/40 transition-all"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>8am</span>
          <span>12pm</span>
          <span>4pm</span>
          <span>8pm</span>
        </div>
      </CardContent>
    </Card>
  );
}
