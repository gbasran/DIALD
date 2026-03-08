import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import type { Course } from '@/lib/types';

interface StatCardsProps {
  courses: Course[];
  dueThisWeek: number;
  focusTodayMinutes: number;
  weeklyGoalProgress: number;
}

export function StatCards({ courses, dueThisWeek, focusTodayMinutes, weeklyGoalProgress }: StatCardsProps) {
  const focusSub = focusTodayMinutes > 0 ? 'keep it up' : 'start a session';
  const goalSub = weeklyGoalProgress >= 100 ? 'goal reached!' : weeklyGoalProgress >= 50 ? 'on track' : 'getting started';

  const stats = [
    { title: 'Active Courses', value: String(courses.length), icon: BookOpen, sub: 'this semester', color: '' },
    { title: 'Due This Week', value: String(dueThisWeek), icon: Target, sub: `${dueThisWeek === 0 ? 'all clear' : 'assignments pending'}`, color: dueThisWeek > 0 ? 'text-destructive' : '' },
    { title: 'Focus Today', value: `${focusTodayMinutes}m`, icon: Clock, sub: focusSub, color: 'text-accent' },
    { title: 'Weekly Goal', value: `${weeklyGoalProgress}%`, icon: TrendingUp, sub: goalSub, color: '' },
  ];

  return (
    <>
      {stats.map((s) => (
        <div key={s.title} className="glass glow-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{s.title}</p>
            <s.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
          <p className="font-heading text-2xl font-bold tracking-tight">{s.value}</p>
          <p className={`text-[10px] ${s.color || 'text-muted-foreground/60'}`}>{s.sub}</p>
        </div>
      ))}
    </>
  );
}
