'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Target, TrendingUp, Flame, Zap, Brain, RefreshCw, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { getUrgencyColor, getUrgencyBorder, formatRelativeDate, getGreeting } from '@/lib/utils';
import { WhatNowCard } from '@/components/dashboard/WhatNowCard';
import { STORAGE_KEYS } from '@/lib/types';
import type { ClassTime, WhatNowResult, InsightCard, ChatMessage } from '@/lib/types';

const WHATNOW_CACHE_KEY = 'diald-whatnow-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface WhatNowCache {
  result: WhatNowResult;
  cachedAt: number;
  assignmentHash: string;
}

function computeAssignmentHash(assignments: Array<{ id: string; status: string }>): string {
  return assignments
    .filter(a => a.status !== 'done')
    .map(a => `${a.id}:${a.status}`)
    .sort()
    .join('|');
}

// Demo data (kept for panels not yet wired to real data)
const demoActivity = [
  { id: '1', action: 'Completed focus session', detail: 'CS 301 -- 45 min', time: '2h ago', type: 'study' as const },
  { id: '2', action: 'Assignment submitted', detail: 'MATH 240 PS6', time: '4h ago', type: 'assignment' as const },
  { id: '3', action: 'Streak milestone!', detail: '7-day streak', time: '5h ago', type: 'achievement' as const },
  { id: '4', action: 'AI chat session', detail: 'Sorting algorithms', time: '1d ago', type: 'chat' as const },
];

const demoWeek = [true, true, true, false, true, true, true];
const demoHourly = [0, 0, 15, 45, 30, 0, 22, 15, 0, 0, 0, 0];

const activityDot: Record<string, string> = {
  study: 'bg-primary',
  assignment: 'bg-[hsl(var(--warning))]',
  achievement: 'bg-accent',
  chat: 'bg-[hsl(var(--focus-purple))]',
};

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const WEEK_DAY_ABBREV: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' };

export default function DashboardPage() {
  const router = useRouter();
  const { courses, isLoaded: coursesLoaded } = useCourses();
  const { assignments, isLoaded: assignmentsLoaded } = useAssignments();
  const [greeting, setGreeting] = useState('');
  const [todayName, setTodayName] = useState('');
  const [aiResult, setAiResult] = useState<WhatNowResult | null>(null);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [lastChatTime, setLastChatTime] = useState<string>('');

  useEffect(() => {
    setGreeting(getGreeting());
    setTodayName(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

    // Read last chat interaction time from localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (raw) {
        const messages: ChatMessage[] = JSON.parse(raw);
        if (messages.length > 0) {
          const latest = Math.max(...messages.map(m => m.timestamp));
          const diff = Date.now() - latest;
          const minutes = Math.floor(diff / 60000);
          const hours = Math.floor(diff / 3600000);
          const days = Math.floor(diff / 86400000);
          if (days > 0) setLastChatTime(`${days}d ago`);
          else if (hours > 0) setLastChatTime(`${hours}h ago`);
          else if (minutes > 0) setLastChatTime(`${minutes}m ago`);
          else setLastChatTime('just now');
        }
      }
    } catch { /* no chat history */ }
  }, []);

  // What Now AI caching logic
  useEffect(() => {
    if (!assignmentsLoaded || !coursesLoaded) return;
    const hash = computeAssignmentHash(assignments);

    // Check cache
    try {
      const raw = localStorage.getItem(WHATNOW_CACHE_KEY);
      if (raw) {
        const cache: WhatNowCache = JSON.parse(raw);
        if (cache.assignmentHash === hash && Date.now() - cache.cachedAt < CACHE_TTL) {
          setAiResult(cache.result);
          return;
        }
      }
    } catch { /* invalid cache, refetch */ }

    // Build context for API
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const apiAssignments = assignments.map(a => ({
      id: a.id,
      name: a.name,
      courseCode: courseMap.get(a.courseId)?.code || 'Unknown',
      dueDate: a.dueDate,
      estimatedMinutes: a.estimatedMinutes,
      status: a.status,
    }));
    const apiCourses = courses.map(c => ({
      code: c.code,
      name: c.name,
      schedule: c.schedule.map(s => ({ day: s.day, startTime: s.startTime, endTime: s.endTime })),
    }));

    fetch('/api/whatnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: apiAssignments, courses: apiCourses }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((result: WhatNowResult) => {
        setAiResult(result);
        const cache: WhatNowCache = { result, cachedAt: Date.now(), assignmentHash: hash };
        localStorage.setItem(WHATNOW_CACHE_KEY, JSON.stringify(cache));
      })
      .catch(() => {
        // Fallback: AI unavailable, aiResult stays null -> use deadline-based
      });
  }, [assignments, courses, assignmentsLoaded, coursesLoaded]);

  // Fetch insights
  const fetchInsights = useCallback(() => {
    if (!assignmentsLoaded || !coursesLoaded) return;
    setInsightsLoading(true);
    const cMap = new Map(courses.map(c => [c.id, c]));
    const apiAssignments = assignments.map(a => ({
      name: a.name,
      courseCode: cMap.get(a.courseId)?.code || 'Unknown',
      dueDate: a.dueDate,
      estimatedMinutes: a.estimatedMinutes,
      status: a.status,
    }));
    const apiCourses = courses.map(c => ({ code: c.code, name: c.name }));

    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: apiAssignments, courses: apiCourses }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: { insights: InsightCard[] }) => {
        setInsights(data.insights);
      })
      .catch(() => {
        setInsights([{
          id: 'fallback',
          title: 'Keep going',
          description: 'Keep going -- every study session counts!',
          type: 'encouragement',
        }]);
      })
      .finally(() => setInsightsLoading(false));
  }, [assignments, courses, assignmentsLoaded, coursesLoaded]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const goalPct = Math.min(Math.round((127 / 150) * 100), 100);
  const maxH = Math.max(...demoHourly, 1);

  // Loading state — match layout dimensions while data loads
  if (!coursesLoaded || !assignmentsLoaded) {
    return (
      <div className="flex h-full flex-col animate-fade-in">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">&nbsp;</p>
            <h2 className="font-heading text-xl font-bold tracking-tight">Mission Control</h2>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 gap-2.5 grid-cols-[180px_1fr_1fr]">
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass glow-border rounded-xl p-3 animate-pulse h-[88px]" />
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="glass glow-border rounded-xl p-4 animate-pulse h-[80px]" />
            <div className="glass glow-border rounded-xl p-3.5 animate-pulse flex-1" />
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="glass glow-border rounded-xl p-3.5 animate-pulse h-[200px]" />
            <div className="glass glow-border rounded-xl p-3.5 animate-pulse flex-1" />
          </div>
        </div>
      </div>
    );
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
  endOfWeek.setDate(startOfWeek.getDate() + 4);
  endOfWeek.setHours(23, 59, 59, 999);
  for (const a of incompleteAssignments) {
    const due = new Date(a.dueDate);
    if (due >= startOfWeek && due <= endOfWeek) {
      const dayName = due.toLocaleDateString('en-US', { weekday: 'long' });
      assignmentsByDay.get(dayName)?.push(a);
    }
  }

  const upcoming = incompleteAssignments
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      title: a.name,
      course: courseMap.get(a.courseId)?.code || 'Unknown',
      due: formatRelativeDate(a.dueDate),
      urgencyBorder: getUrgencyBorder(a.dueDate),
      urgencyColor: getUrgencyColor(a.dueDate),
    }));

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

        {/* ── LEFT COLUMN: Stats ── */}
        <div className="flex flex-col gap-2.5">
          {/* Stat tiles */}
          {[
            { title: 'Active Courses', value: String(courses.length), icon: BookOpen, sub: 'this semester', color: '' },
            { title: 'Due This Week', value: String(dueThisWeek), icon: Target, sub: `${dueThisWeek === 0 ? 'all clear' : 'assignments pending'}`, color: dueThisWeek > 0 ? 'text-destructive' : '' },
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
          {/* What Now — AI-powered or deadline fallback */}
          <WhatNowCard
            task={aiResult?.task || (mostUrgent ? mostUrgent.name : 'All caught up!')}
            course={aiResult?.courseCode || (mostUrgent ? (courseMap.get(mostUrgent.courseId)?.code || 'Unknown') : '')}
            reason={aiResult?.reason || (mostUrgent ? `Due soonest -- ${formatRelativeDate(mostUrgent.dueDate)}` : 'No pending assignments. Time to get ahead or take a break.')}
            className="glass glow-border"
          />

          {/* This Week — weekly schedule view */}
          <div className="glass glow-border rounded-xl p-3.5 flex-1 min-h-0 flex flex-col">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">This Week</p>
            {courses.length > 0 ? (
              <div className="grid grid-cols-5 gap-1 flex-1">
                {WEEK_DAYS.map((day) => {
                  const classes = scheduleByDay.get(day) || [];
                  const dayAssignments = assignmentsByDay.get(day) || [];
                  const isToday = todayName === day;
                  return (
                    <div key={day} className="flex flex-col min-w-0">
                      <p className={`text-[9px] font-semibold text-center mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground/50'}`}>
                        {WEEK_DAY_ABBREV[day]}
                      </p>
                      <div className={`flex flex-col gap-0.5 flex-1 rounded-md p-0.5 ${isToday ? 'bg-primary/[0.06] ring-1 ring-primary/20' : ''}`}>
                        {classes.map((entry, idx) => (
                          <div
                            key={`c-${idx}`}
                            className="rounded px-1 py-0.5 text-white/90"
                            style={{ backgroundColor: entry.course.color }}
                          >
                            <p className="text-[8px] font-bold leading-tight truncate">{entry.course.code}</p>
                            <p className="text-[7px] leading-tight opacity-80">{entry.classTime.startTime}</p>
                          </div>
                        ))}
                        {dayAssignments.map((a) => (
                          <div
                            key={`a-${a.id}`}
                            className={`rounded px-1 py-0.5 border border-dashed ${getUrgencyBorder(a.dueDate)} bg-background/40`}
                          >
                            <p className="text-[8px] font-medium leading-tight truncate">{a.name}</p>
                            <p className={`text-[7px] leading-tight ${getUrgencyColor(a.dueDate)}`}>Due</p>
                          </div>
                        ))}
                        {classes.length === 0 && dayAssignments.length === 0 && (
                          <div className="flex-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60">Add courses to see your week</p>
            )}
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
            {upcoming.length > 0 ? (
              <div className="space-y-1.5">
                {upcoming.map((item) => (
                  <div key={item.id} className={`rounded-md border-l-[3px] bg-background/20 px-2.5 py-1.5 ${item.urgencyBorder}`}>
                    <p className="text-xs font-medium leading-tight">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/60">{item.course}</span>
                      <span className={`text-[10px] font-medium ${item.urgencyColor}`}>{item.due}</span>
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
                {lastChatTime && (
                  <p className="text-[10px] text-muted-foreground/60">Last chat {lastChatTime}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border/30">
              <button
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
                  window.location.href = '/chat';
                }}
                className="flex items-center justify-center gap-1.5 bg-background px-3 py-2 text-[11px] font-medium text-primary transition-colors hover:bg-primary/[0.06]"
              >
                <Plus className="h-3 w-3" />
                New Chat
              </button>
              {lastChatTime ? (
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-1.5 bg-background px-3 py-2 text-[11px] font-medium text-[hsl(var(--focus-purple))] transition-colors hover:bg-[hsl(var(--focus-purple))]/[0.06]"
                >
                  Continue
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-1.5 bg-background px-3 py-2 text-[11px] font-medium text-[hsl(var(--focus-purple))] transition-colors hover:bg-[hsl(var(--focus-purple))]/[0.06]"
                >
                  Start Chatting
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* AI Insights — dynamic panel */}
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
