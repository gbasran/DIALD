import { BookOpen, Clock, Target, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressPanel } from '@/components/dashboard/ProgressPanel';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { UpcomingPanel } from '@/components/dashboard/UpcomingPanel';
import { StreakGauge } from '@/components/dashboard/StreakGauge';
import { WhatNowCard } from '@/components/dashboard/WhatNowCard';
import { FocusTimeSummary } from '@/components/dashboard/FocusTimeSummary';

// Demo data -- will be replaced by real data sources in later phases
const demoStats = {
  coursesActive: 4,
  assignmentsDue: 3,
  focusToday: 127,
  weeklyGoal: 85,
};

const demoCourseProgress = [
  { label: 'CS 301 - Algorithms', value: 72, max: 100, color: 'bg-primary' },
  { label: 'MATH 240 - Linear Algebra', value: 58, max: 100, color: 'bg-accent' },
  { label: 'PSY 101 - Intro Psychology', value: 91, max: 100, color: 'bg-[hsl(var(--focus-purple))]' },
  { label: 'ENG 205 - Technical Writing', value: 45, max: 100, color: 'bg-[hsl(var(--warning))]' },
];

const demoUpcoming = [
  { id: '1', title: 'Algorithm Analysis Essay', course: 'CS 301', due: 'Tomorrow', urgency: 'high' as const },
  { id: '2', title: 'Linear Algebra Problem Set 7', course: 'MATH 240', due: 'Wed', urgency: 'medium' as const },
  { id: '3', title: 'Chapter 12 Reading', course: 'PSY 101', due: 'Fri', urgency: 'low' as const },
  { id: '4', title: 'Peer Review Draft', course: 'ENG 205', due: 'Next Mon', urgency: 'low' as const },
];

const demoActivity = [
  { id: '1', action: 'Completed focus session', detail: 'CS 301 -- 45 min deep work', time: '2h ago', type: 'study' as const },
  { id: '2', action: 'Assignment submitted', detail: 'MATH 240 Problem Set 6', time: '4h ago', type: 'assignment' as const },
  { id: '3', action: 'Streak milestone!', detail: '7-day study streak reached', time: '5h ago', type: 'achievement' as const },
  { id: '4', action: 'AI chat session', detail: 'Reviewed sorting algorithms', time: '1d ago', type: 'chat' as const },
  { id: '5', action: 'Completed focus session', detail: 'ENG 205 -- 30 min writing', time: '1d ago', type: 'study' as const },
];

const demoWeekStudied = [true, true, true, false, true, true, true];

const demoHourlyFocus = [0, 0, 15, 45, 30, 0, 22, 15, 0, 0, 0, 0];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Page header — Rho-style clean header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Good evening</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* What Now -- hero card, full width */}
      <WhatNowCard
        task="Finish Algorithm Analysis Essay"
        course="CS 301 -- Due tomorrow"
        reason="This is your highest-priority item based on deadline and course weight."
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Active Courses"
          value={String(demoStats.coursesActive)}
          icon={BookOpen}
          subtitle="this semester"
        />
        <StatCard
          title="Due This Week"
          value={String(demoStats.assignmentsDue)}
          icon={Target}
          trend={{ value: '1 from yesterday', positive: false }}
        />
        <StatCard
          title="Focus Today"
          value={`${demoStats.focusToday}m`}
          icon={Clock}
          trend={{ value: '23m vs avg', positive: true }}
        />
        <StatCard
          title="Weekly Goal"
          value={`${demoStats.weeklyGoal}%`}
          icon={TrendingUp}
          subtitle="on track"
        />
      </div>

      {/* Main grid -- 2 column on desktop, stacked on mobile */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left column -- wider */}
        <div className="space-y-4 lg:col-span-7">
          <ProgressPanel title="Course Progress" items={demoCourseProgress} />
          <UpcomingPanel title="Upcoming Assignments" items={demoUpcoming} />
          <ActivityFeed title="Recent Activity" items={demoActivity} />
        </div>

        {/* Right column -- narrower */}
        <div className="space-y-4 lg:col-span-5">
          <StreakGauge
            currentStreak={7}
            bestStreak={14}
            weekData={demoWeekStudied}
          />
          <FocusTimeSummary
            todayMinutes={127}
            weekMinutes={485}
            goalMinutes={150}
            hourlyData={demoHourlyFocus}
          />
        </div>
      </div>
    </div>
  );
}
