import { formatRelativeTime } from '@/lib/utils';
import type { Assignment, Course } from '@/lib/types';

export interface ActivityEvent {
  id: string;
  action: string;
  detail: string;
  time: string;
  timestamp: number;
  type: 'assignment' | 'achievement';
}

export function deriveActivityEvents(
  assignments: Assignment[],
  courses: Course[]
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

  return events
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(e => ({ ...e, time: formatRelativeTime(e.timestamp) }));
}
