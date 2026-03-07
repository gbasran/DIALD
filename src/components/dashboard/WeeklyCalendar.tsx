import type { Course, ClassTime, Assignment } from '@/lib/types';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const WEEK_DAY_ABBREV: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

interface WeeklyCalendarProps {
  courses: Course[];
  scheduleByDay: Map<string, Array<{ course: Course; classTime: ClassTime }>>;
  assignmentsByDay: Map<string, Assignment[]>;
  courseMap: Map<string, Course>;
  todayName: string;
}

export function WeeklyCalendar({ courses, scheduleByDay, assignmentsByDay, courseMap, todayName }: WeeklyCalendarProps) {
  return (
    <div className="glass glow-border rounded-xl p-3.5 flex-1 min-h-0 flex flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">This Week</p>
      {courses.length > 0 ? (
        <div className="grid grid-cols-7 gap-1 flex-1">
          {WEEK_DAYS.map((day) => {
            const classes = scheduleByDay.get(day) || [];
            const dayAssignments = assignmentsByDay.get(day) || [];
            const isToday = todayName === day;
            return (
              <div key={day} className="flex flex-col min-w-0">
                <p className={`text-[9px] font-semibold text-center mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground/50'}`}>
                  {WEEK_DAY_ABBREV[day]}
                </p>
                <div className={`flex flex-col gap-0.5 flex-1 rounded-md p-0.5 overflow-y-auto ${isToday ? 'bg-primary/[0.06] ring-1 ring-primary/20' : ''}`}>
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
                  {dayAssignments.map((a) => {
                    const course = courseMap.get(a.courseId);
                    return (
                      <div
                        key={`a-${a.id}`}
                        className="rounded px-1 py-0.5 text-white/90"
                        style={{ backgroundColor: course?.color ?? 'hsl(var(--muted))', opacity: 0.75 }}
                      >
                        <p className="text-[8px] font-bold leading-tight truncate">{a.name}</p>
                        <p className="text-[7px] leading-tight opacity-80">Due</p>
                      </div>
                    );
                  })}
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
  );
}
