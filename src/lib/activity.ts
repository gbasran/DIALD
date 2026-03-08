import { formatRelativeTime } from '@/lib/utils';
import type { Assignment, Course, FocusSession } from '@/lib/types';

export interface ActivityEvent {
  id: string;
  action: string;
  detail: string;
  time: string;
  timestamp: number;
  type: 'assignment' | 'achievement' | 'focus';
}

export function deriveActivityEvents(
  assignments: Assignment[],
  courses: Course[],
  focusSessions?: FocusSession[]
): ActivityEvent[] {
  const courseMap = new Map<string, Course>(courses.map(c => [c.id, c]));
  const events: Array<Omit<ActivityEvent, 'time'>> = [];

  for (const a of assignments) {
    const courseCode = courseMap.get(a.courseId)?.code || 'Unknown';
    const detail = `${courseCode} -- ${a.name}`;

    if (a.completedAt) {
      events.push({
        id: `${a.id}-completed`,
        action: 'Completed',
        detail,
        timestamp: new Date(a.completedAt).getTime(),
        type: 'achievement',
      });
    }

    if (a.startedAt) {
      events.push({
        id: `${a.id}-started`,
        action: 'Started working on',
        detail,
        timestamp: new Date(a.startedAt).getTime(),
        type: 'assignment',
      });
    }

    if (a.createdAt) {
      events.push({
        id: `${a.id}-created`,
        action: 'Added assignment',
        detail,
        timestamp: new Date(a.createdAt).getTime(),
        type: 'assignment',
      });
    }
  }

  if (focusSessions) {
    for (const session of focusSessions) {
      if (!session.completed) continue;
      const courseCode = session.courseId ? courseMap.get(session.courseId)?.code : null;
      events.push({
        id: `focus-${session.id}`,
        action: 'Focused for',
        detail: courseCode ? `${session.duration}m on ${courseCode}` : `${session.duration}m free focus`,
        timestamp: new Date(session.startTime).getTime(),
        type: 'focus',
      });
    }
  }

  return events
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(e => ({ ...e, time: formatRelativeTime(e.timestamp) }));
}
