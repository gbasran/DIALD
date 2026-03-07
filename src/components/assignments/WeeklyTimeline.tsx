'use client';

import { useState, useEffect } from 'react';
import type { Assignment, Course } from '@/lib/types';
import { getUrgencyBorder, formatRelativeDate } from '@/lib/utils';
import { StatusDots } from '@/components/assignments/StatusDots';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeeklyTimelineProps {
  assignments: Assignment[];
  courses: Course[];
  onStatusChange: (id: string, status: Assignment['status']) => void;
  onEdit: (assignment: Assignment) => void;
  maxPerDay?: number;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  // day 0 = Sunday, 1 = Monday, etc.
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const monStr = monday.toLocaleDateString('en-US', opts);
  const sunStr = sunday.toLocaleDateString('en-US', opts);
  const year = sunday.getFullYear();

  return `${monStr} – ${sunStr}, ${year}`;
}

const STATUS_ORDER: Record<Assignment['status'], number> = {
  'in-progress': 0,
  'todo': 1,
  'done': 2,
};

export function WeeklyTimeline({
  assignments,
  courses,
  onStatusChange,
  onEdit,
  maxPerDay,
}: WeeklyTimelineProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentWeekStart(getMonday(new Date()));
  }, []);

  if (!currentWeekStart) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const today = new Date();
  const isCurrentWeek = isSameDay(getMonday(today), currentWeekStart);

  // Build the 7 days (Mon-Sun)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  // Group assignments by day
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const dayAssignments = days.map((day) => {
    const filtered = assignments.filter((a) => {
      const dueDate = new Date(a.dueDate);
      return isSameDay(dueDate, day);
    });
    // Sort: in-progress first, then todo, then done; within each group by due time
    filtered.sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    return filtered;
  });

  function goToPrev() {
    setCurrentWeekStart((prev) => {
      if (!prev) return prev;
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function goToNext() {
    setCurrentWeekStart((prev) => {
      if (!prev) return prev;
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  function goToToday() {
    setCurrentWeekStart(getMonday(new Date()));
  }

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrev}
            className="rounded-md border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="rounded-md border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium ml-1">
            {formatWeekRange(currentWeekStart)}
          </span>
        </div>
        <button
          type="button"
          onClick={goToToday}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            isCurrentWeek
              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Today
        </button>
      </div>

      {/* Timeline grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const items = dayAssignments[i];

          return (
            <div
              key={i}
              className={`rounded-lg p-2 min-h-[12rem] flex flex-col ${
                isToday
                  ? 'bg-primary/[0.06] ring-1 ring-primary/20'
                  : 'bg-muted/30'
              }`}
            >
              {/* Column header */}
              <div className={`text-center pb-2 border-b mb-2 ${
                isToday ? 'border-primary/20' : 'border-border/50'
              }`}>
                <div className={`text-xs uppercase tracking-wider ${
                  isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}>
                  {DAY_NAMES[i]}
                </div>
                <div className={`text-lg font-semibold ${
                  isToday ? 'text-primary' : 'text-foreground'
                }`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Assignment cards */}
              <div className="flex-1 space-y-2">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center mt-4">
                    No assignments
                  </p>
                )}
                {(maxPerDay ? items.slice(0, maxPerDay) : items).map((assignment) => {
                  const course = courseMap.get(assignment.courseId);
                  return (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => onEdit(assignment)}
                      className={`w-full text-left rounded-lg border border-l-[3px] ${getUrgencyBorder(
                        assignment.dueDate
                      )} glass p-2 hover:bg-muted/50 transition-colors cursor-pointer`}
                    >
                      <p className="text-sm font-medium leading-tight line-clamp-2">
                        {assignment.name}
                      </p>
                      {course && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: course.color }}
                          />
                          <span className="text-xs text-muted-foreground truncate">
                            {course.code}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeDate(assignment.dueDate)}
                      </p>
                      {assignment.estimatedMinutes > 0 && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          ~{assignment.estimatedMinutes}min
                        </p>
                      )}
                      <div
                        className="mt-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StatusDots
                          status={assignment.status}
                          onStatusChange={(status) =>
                            onStatusChange(assignment.id, status)
                          }
                          interactive
                          size="sm"
                        />
                      </div>
                    </button>
                  );
                })}
                {maxPerDay && items.length > maxPerDay && (
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    +{items.length - maxPerDay} more due
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
