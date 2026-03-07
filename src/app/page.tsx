import { BookOpen, Clock, Target, TrendingUp, Flame, Sparkles, ArrowRight, Zap, Brain } from 'lucide-react';

// Demo data
const demoStats = { coursesActive: 4, assignmentsDue: 3, focusToday: 127, weeklyGoal: 85 };

const demoCourseProgress = [
  { label: 'CS 301 - Algorithms', value: 72, color: 'bg-primary' },
  { label: 'MATH 240 - Linear Algebra', value: 58, color: 'bg-accent' },
  { label: 'PSY 101 - Intro Psychology', value: 91, color: 'bg-[hsl(var(--focus-purple))]' },
  { label: 'ENG 205 - Technical Writing', value: 45, color: 'bg-[hsl(var(--warning))]' },
];

const demoUpcoming = [
  { id: '1', title: 'Algorithm Analysis Essay', course: 'CS 301', due: 'Tomorrow', urgency: 'high' as const },
  { id: '2', title: 'Linear Algebra Problem Set 7', course: 'MATH 240', due: 'Wed', urgency: 'medium' as const },
  { id: '3', title: 'Chapter 12 Reading', course: 'PSY 101', due: 'Fri', urgency: 'low' as const },
  { id: '4', title: 'Peer Review Draft', course: 'ENG 205', due: 'Next Mon', urgency: 'low' as const },
];

const demoActivity = [
  { id: '1', action: 'Completed focus session', detail: 'CS 301 -- 45 min', time: '2h ago', type: 'study' as const },
  { id: '2', action: 'Assignment submitted', detail: 'MATH 240 PS6', time: '4h ago', type: 'assignment' as const },
  { id: '3', action: 'Streak milestone!', detail: '7-day streak', time: '5h ago', type: 'achievement' as const },
  { id: '4', action: 'AI chat session', detail: 'Sorting algorithms', time: '1d ago', type: 'chat' as const },
];

const demoWeek = [true, true, true, false, true, true, true];
const demoHourly = [0, 0, 15, 45, 30, 0, 22, 15, 0, 0, 0, 0];

const urgencyBorder: Record<string, string> = {
  high: 'border-l-destructive',
  medium: 'border-l-[hsl(var(--warning))]',
  low: 'border-l-accent',
};

const activityDot: Record<string, string> = {
  study: 'bg-primary',
  assignment: 'bg-[hsl(var(--warning))]',
  achievement: 'bg-accent',
  chat: 'bg-[hsl(var(--focus-purple))]',
};

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardPage() {
  const goalPct = Math.min(Math.round((demoStats.focusToday / 150) * 100), 100);
  const maxH = Math.max(...demoHourly, 1);

  return (
    <div className="flex h-full flex-col animate-fade-in">
      {/* Header row */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Good evening</p>
          <h2 className="font-heading text-xl font-bold tracking-tight">Mission Control</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Full viewport grid */}
      <div className="grid min-h-0 flex-1 gap-2.5 grid-cols-[180px_1fr_1fr]">

        {/* ── LEFT COLUMN: Stats ── */}
        <div className="flex flex-col gap-2.5">
          {/* Stat tiles */}
          {[
            { title: 'Active Courses', value: '4', icon: BookOpen, sub: 'this semester', color: '' },
            { title: 'Due This Week', value: '3', icon: Target, sub: '↓ 1 from yesterday', color: 'text-destructive' },
            { title: 'Focus Today', value: '127m', icon: Clock, sub: '↑ 23m vs avg', color: 'text-accent' },
            { title: 'Weekly Goal', value: '85%', icon: TrendingUp, sub: 'on track', color: '' },
          ].map((s) => (
            <div key={s.title} className="glass glow-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{s.title}</p>
                <s.icon className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
              <p className="font-heading text-2xl font-bold tracking-tight">{s.value}</p>
              <p className={`text-[10px] ${s.color || 'text-muted-foreground/60'}`}>{s.sub}</p>
            </div>
          ))}

          {/* Recent Activity — compact for left column */}
          <div className="glass glow-border flex-1 rounded-xl p-3 flex flex-col min-h-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Activity</p>
            <div className="space-y-2 flex-1 overflow-hidden">
              {demoActivity.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-1.5">
                  <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${activityDot[item.type]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium leading-tight truncate">{item.action}</p>
                    <p className="text-[9px] text-muted-foreground/40">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN ── */}
        <div className="flex flex-col gap-2.5 min-h-0">
          {/* What Now */}
          <div className="glass glow-border rounded-xl border-primary/20 bg-primary/[0.03] p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Suggested Next</span>
                </div>
                <h3 className="font-heading text-base font-bold leading-snug tracking-tight">Finish Algorithm Analysis Essay</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">CS 301 -- Due tomorrow</p>
              </div>
              <button className="ml-3 shrink-0 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                Start <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Course Progress */}
          <div className="glass glow-border rounded-xl p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2.5">Course Progress</p>
            <div className="space-y-2.5">
              {demoCourseProgress.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium">{c.label}</span>
                    <span className="tabular-nums text-muted-foreground">{c.value}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <div className={`h-full rounded-full ${c.color} transition-all duration-500`} style={{ width: `${c.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Streak + Focus Time — side by side to fill space */}
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
            {/* Streak */}
            <div className="glass glow-border rounded-xl p-3.5 flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Study Streak</p>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="rounded-lg bg-[hsl(var(--warning))]/15 p-2">
                  <Flame className="h-5 w-5 text-[hsl(var(--warning))]" />
                </div>
                <div>
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
              <p className="mt-2 text-[10px] text-muted-foreground/50">Best: <span className="font-medium text-foreground">14 days</span></p>
            </div>

            {/* Focus Time */}
            <div className="glass glow-border rounded-xl p-3.5 flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Focus Time</p>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="font-heading text-2xl font-bold leading-none">127<span className="text-sm font-normal text-muted-foreground">m</span></p>
                  <p className="text-[10px] text-muted-foreground/60">today</p>
                </div>
                <div className="text-right">
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
          </div>
        </div>

        {/* ── RIGHT COLUMN: Intel feeds ── */}
        <div className="flex flex-col gap-2.5 min-h-0">
          {/* Upcoming */}
          <div className="glass glow-border rounded-xl p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Upcoming Assignments</p>
            <div className="space-y-1.5">
              {demoUpcoming.map((item) => (
                <div key={item.id} className={`rounded-md border-l-[3px] bg-background/20 px-2.5 py-1.5 ${urgencyBorder[item.urgency]}`}>
                  <p className="text-xs font-medium leading-tight">{item.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/60">{item.course}</span>
                    <span className="text-[10px] font-medium text-muted-foreground/60">{item.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights — bigger panel */}
          <div className="glass glow-border rounded-xl p-3.5 flex-1 min-h-0 flex flex-col border-[hsl(var(--focus-purple))]/10">
            <div className="flex items-center gap-1.5 mb-3">
              <Brain className="h-3.5 w-3.5 text-[hsl(var(--focus-purple))]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--focus-purple))]">AI Insights</span>
            </div>
            <div className="space-y-3 flex-1">
              <div className="rounded-lg bg-[hsl(var(--focus-purple))]/[0.06] p-2.5">
                <p className="text-xs font-medium mb-0.5">Peak Performance Window</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Your focus peaks between 10-11am. Schedule hard tasks there for 2x effectiveness.
                </p>
              </div>
              <div className="rounded-lg bg-primary/[0.06] p-2.5">
                <p className="text-xs font-medium mb-0.5">Study Strategy</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  CS 301 essay is 40% of your grade. Break it into 3 sessions of 45min for best retention.
                </p>
              </div>
              <div className="rounded-lg bg-accent/[0.06] p-2.5">
                <p className="text-xs font-medium mb-0.5">Streak Alert</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  7-day streak! One more week unlocks your personal best. Keep the momentum.
                </p>
              </div>
            </div>
            <div className="mt-2 h-px bg-border/20" />
            <p className="mt-1.5 text-[10px] text-muted-foreground/40">Powered by your study patterns -- 14 days of data</p>
          </div>

          {/* Weekly Strategy mini tile */}
          <div className="glass glow-border rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">This Week</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-heading text-lg font-bold">3</p>
                <p className="text-[9px] text-muted-foreground/50">Due</p>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-accent">2</p>
                <p className="text-[9px] text-muted-foreground/50">Done</p>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-[hsl(var(--focus-purple))]">8h</p>
                <p className="text-[9px] text-muted-foreground/50">Studied</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
