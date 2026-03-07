import type { Assignment, Course } from '@/lib/types';

export interface ActivityEvent {
  id: string;
  action: string;
  detail: string;
  time: string;
  timestamp: number;
  type: 'assignment' | 'achievement';
}

function formatRelativeTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function deriveActivityEvents(
  assignments: Assignment[],
  courses: Course[]
): ActivityEvent[] {
  const courseMap = new Map<string, Course>(courses.map(c => [c.id, c]));
  const events: ActivityEvent[] = [];

  for (const a of assignments) {
    const courseCode = courseMap.get(a.courseId)?.code || 'Unknown';
    const detail = `${courseCode} -- ${a.name}`;

    if (a.completedAt) {
      const ts = new Date(a.completedAt).getTime();
      events.push({
        id: `${a.id}-completed`,
        action: 'Completed',
        detail,
        time: '',
        timestamp: ts,
        type: 'achievement',
      });
    }

    if (a.startedAt) {
      const ts = new Date(a.startedAt).getTime();
      events.push({
        id: `${a.id}-started`,
        action: 'Started working on',
        detail,
        time: '',
        timestamp: ts,
        type: 'assignment',
      });
    }

    if (a.createdAt) {
      const ts = new Date(a.createdAt).getTime();
      events.push({
        id: `${a.id}-created`,
        action: 'Added assignment',
        detail,
        time: '',
        timestamp: ts,
        type: 'assignment',
      });
    }
  }

  events.sort((a, b) => b.timestamp - a.timestamp);

  for (const event of events) {
    event.time = formatRelativeTimestamp(event.timestamp);
  }

  return events.slice(0, 5);
}
