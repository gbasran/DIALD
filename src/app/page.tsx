'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Brain, RefreshCw, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { useWhatNow } from '@/hooks/use-whatnow';
import { useInsights } from '@/hooks/use-insights';
import { getUrgencyColor, getUrgencyBorder, formatRelativeDate, getGreeting } from '@/lib/utils';
import { deriveActivityEvents } from '@/lib/activity';
import { WhatNowCard } from '@/components/dashboard/WhatNowCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCards } from '@/components/dashboard/StatCards';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar';
import { StudyStreak } from '@/components/dashboard/StudyStreak';
import { FocusTimePanel } from '@/components/dashboard/FocusTimePanel';
import { StatusDots } from '@/components/assignments/StatusDots';
import { useLastConversation } from '@/hooks/use-last-conversation';
import { useFocusSessions } from '@/hooks/use-focus-sessions';
import type { ClassTime } from '@/lib/types';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { courses, isLoaded: coursesLoaded } = useCourses();
  const { assignments, isLoaded: assignmentsLoaded, changeStatus } = useAssignments();
  const aiResult = useWhatNow();
  const { insights, isLoading: insightsLoading, refresh: fetchInsights } = useInsights();

  const lastConversation = useLastConversation();
  const { sessions, isLoaded: sessionsLoaded, todayMinutes, weeklyTotal, goalProgress } = useFocusSessions();

  const [greeting, setGreeting] = useState('');
  const [todayName, setTodayName] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
    setTodayName(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  }, []);

  // Loading state
  if (!coursesLoaded || !assignmentsLoaded || !sessionsLoaded) {
    return <DashboardSkeleton />;
  }

  // Computed values from real data
  const incompleteAssignments = assignments.filter(a => a.status !== 'done');
  const dueThisWeek = incompleteAssignments.filter(a => {
    const due = new Date(a.dueDate);
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return due <= weekFromNow;
  }).length;
  const doneThisWeek = assignments.filter(a => a.status === 'done').length;
  const mostUrgent = [...incompleteAssignments].sort((a, b) => {
    const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return diff !== 0 ? diff : a.estimatedMinutes - b.estimatedMinutes;
  })[0] || null;
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // Build schedule-by-day map for weekly view
  const scheduleByDay = new Map<string, Array<{ course: typeof courses[0]; classTime: ClassTime }>>();
  for (const day of WEEK_DAYS) scheduleByDay.set(day, []);
  for (const course of courses) {
    for (const ct of course.schedule) {
      scheduleByDay.get(ct.day)?.push({ course, classTime: ct });
    }
  }
  for (const entries of scheduleByDay.values()) {
    entries.sort((a, b) => a.classTime.startTime.localeCompare(b.classTime.startTime));
  }

  // Map incomplete assignments to their due date's weekday (this week only)
  const assignmentsByDay = new Map<string, Array<typeof incompleteAssignments[0]>>();
  for (const day of WEEK_DAYS) assignmentsByDay.set(day, []);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  for (const a of incompleteAssignments) {
    const due = new Date(a.dueDate);
    if (due >= startOfWeek && due <= endOfWeek) {
      const dayName = due.toLocaleDateString('en-US', { weekday: 'long' });
      assignmentsByDay.get(dayName)?.push(a);
    }
  }

  const upcoming = incompleteAssignments
    .sort((a, b) => {
      if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
      if (a.status !== 'in-progress' && b.status === 'in-progress') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  const activityEvents = deriveActivityEvents(assignments, courses, sessions);

  return (
    <div className="flex h-full flex-col animate-fade-in">
      {/* Header row */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Good {greeting || 'evening'}</p>
          <h2 className="font-heading text-xl font-bold tracking-tight">Mission Control</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Full viewport grid */}
      <div className="grid min-h-0 flex-1 gap-2.5 grid-cols-[180px_1fr_1fr]">

        {/* LEFT COLUMN: Stats */}
        <div className="flex flex-col gap-2.5">
          <StatCards courses={courses} dueThisWeek={dueThisWeek} focusTodayMinutes={todayMinutes} weeklyGoalProgress={goalProgress} />
          <ActivityFeed events={activityEvents} />
        </div>

        {/* CENTER COLUMN */}
        <div className="flex flex-col gap-2.5 min-h-0">
          {/* What Now */}
          <WhatNowCard
            task={aiResult?.task || (mostUrgent ? mostUrgent.name : 'All caught up!')}
            course={aiResult?.courseCode || (mostUrgent ? (courseMap.get(mostUrgent.courseId)?.code || 'Unknown') : '')}
            reason={aiResult?.reason || (mostUrgent ? `Due soonest -- ${formatRelativeDate(mostUrgent.dueDate)}` : 'No pending assignments. Time to get ahead or take a break.')}
            className="glass glow-border"
          />

          <WeeklyCalendar
            courses={courses}
            scheduleByDay={scheduleByDay}
            assignmentsByDay={assignmentsByDay}
            courseMap={courseMap}
            todayName={todayName}
          />

          {/* Study Streak + Focus Time */}
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
            <StudyStreak />
            <FocusTimePanel />
          </div>
        </div>

        {/* RIGHT COLUMN: Intel feeds */}
        <div className="flex flex-col gap-2.5 min-h-0">
          {/* Upcoming */}
          <div className="glass glow-border rounded-xl p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Upcoming Assignments</p>
            {upcoming.length > 0 ? (
              <div className="space-y-1.5">
                {upcoming.map((a) => (
                  <div key={a.id} className={`rounded-md border-l-[3px] bg-background/20 px-2.5 py-1.5 flex items-center gap-2 ${a.status === 'in-progress' ? 'border-l-amber-400' : getUrgencyBorder(a.dueDate)}`}>
                    <StatusDots
                      status={a.status}
                      interactive
                      size="md"
                      onStatusChange={(status) => changeStatus(a.id, status)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate">{a.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground/60">{courseMap.get(a.courseId)?.code || 'Unknown'}</span>
                        <span className={`text-[10px] font-medium ${getUrgencyColor(a.dueDate)}`}>{formatRelativeDate(a.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60">Nothing due -- enjoy the calm</p>
            )}
          </div>

          {/* Chat with DIALD */}
          <div className="glass glow-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3.5 pt-3 pb-2">
              <div className="rounded-lg bg-[hsl(var(--focus-purple))]/15 p-2">
                <MessageSquare className="h-4 w-4 text-[hsl(var(--focus-purple))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[hsl(var(--focus-purple))]">Chat with DIALD</p>
                {lastConversation && (
                  <p className="text-[10px] text-muted-foreground/60">Last chat {lastConversation.time}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border/30">
              <button
                onClick={() => router.push('/chat')}
                className="flex items-center justify-center gap-1.5 bg-background px-3 py-2 text-[11px] font-medium text-primary transition-colors hover:bg-primary/[0.06]"
              >
                <Plus className="h-3 w-3" />
                New Chat
              </button>
              <button
                onClick={() => {
                  if (lastConversation) {
                    router.push(`/chat?c=${lastConversation.id}`);
                  } else {
                    router.push('/chat');
                  }
                }}
                className="flex items-center justify-center gap-1.5 bg-background px-3 py-2 text-[11px] font-medium text-[hsl(var(--focus-purple))] transition-colors hover:bg-[hsl(var(--focus-purple))]/[0.06]"
              >
                {lastConversation ? 'Continue' : 'Start Chatting'}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* AI Insights */}
          <div className="glass glow-border rounded-xl p-3.5 flex-1 min-h-0 flex flex-col border-[hsl(var(--focus-purple))]/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-[hsl(var(--focus-purple))]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--focus-purple))]">AI Insights</span>
              </div>
              <button
                onClick={fetchInsights}
                disabled={insightsLoading}
                className="rounded-md p-1 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20 transition-colors disabled:opacity-50"
                title="Refresh insights"
              >
                <RefreshCw className={`h-3 w-3 ${insightsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-3 flex-1">
              {insightsLoading && insights.length === 0 ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-lg bg-muted/10 p-2.5 animate-pulse h-[60px]" />
                  ))}
                </>
              ) : (
                insights.map(insight => {
                  const bgColor = insight.type === 'deadline'
                    ? 'bg-[hsl(var(--warning))]/[0.06]'
                    : insight.type === 'strategy'
                    ? 'bg-primary/[0.06]'
                    : 'bg-accent/[0.06]';
                  return (
                    <div key={insight.id} className={`rounded-lg ${bgColor} p-2.5`}>
                      <p className="text-xs font-medium mb-0.5">{insight.title}</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">{insight.description}</p>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-2 h-px bg-border/20" />
            <p className="mt-1.5 text-[10px] text-muted-foreground/40">Powered by your study patterns</p>
          </div>

          {/* Weekly Strategy mini tile */}
          <div className="glass glow-border rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">This Week</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-heading text-lg font-bold">{String(dueThisWeek)}</p>
                <p className="text-[9px] text-muted-foreground/50">Due</p>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-accent">{String(doneThisWeek)}</p>
                <p className="text-[9px] text-muted-foreground/50">Done</p>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-[hsl(var(--focus-purple))]">{weeklyTotal >= 60 ? `${Math.floor(weeklyTotal / 60)}h` : weeklyTotal > 0 ? `${weeklyTotal}m` : '0h'}</p>
                <p className="text-[9px] text-muted-foreground/50">Studied</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
