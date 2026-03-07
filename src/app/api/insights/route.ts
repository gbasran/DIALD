import type { InsightCard } from '@/lib/types';

export async function POST(req: Request) {
  let body: {
    courses?: Array<{ code: string; name: string }>;
    assignments?: Array<{
      name: string;
      courseCode: string;
      dueDate: string;
      estimatedMinutes: number;
      status: string;
    }>;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.assignments) || !Array.isArray(body.courses)) {
    return Response.json(
      { error: 'assignments and courses arrays are required' },
      { status: 400 }
    );
  }

  const now = new Date();
  const incomplete = body.assignments.filter((a) => a.status !== 'done');
  const completed = body.assignments.filter((a) => a.status === 'done');
  const insights: InsightCard[] = [];

  // 1. Deadline-aware tip: find nearest deadline
  if (incomplete.length > 0) {
    const sorted = [...incomplete].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    const nearest = sorted[0];
    const dueDate = new Date(nearest.dueDate);
    const hoursUntil = Math.max(
      0,
      Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    );
    const sessions = Math.ceil(nearest.estimatedMinutes / 25);

    let timeDescription: string;
    if (hoursUntil < 24) {
      timeDescription = `due in ${hoursUntil} hours`;
    } else {
      const days = Math.round(hoursUntil / 24);
      timeDescription = `due in ${days} day${days !== 1 ? 's' : ''}`;
    }

    insights.push({
      id: 'insight-deadline',
      title: `${nearest.courseCode} deadline coming up`,
      description: `"${nearest.name}" is ${timeDescription}. Consider ${sessions} focused 25-min session${sessions !== 1 ? 's' : ''} to get it done.`,
      type: 'deadline',
    });
  }

  // 2. Study strategy: biggest assignment by estimated time
  if (incomplete.length > 0) {
    const biggest = [...incomplete].sort(
      (a, b) => b.estimatedMinutes - a.estimatedMinutes
    )[0];
    const chunks = Math.ceil(biggest.estimatedMinutes / 30);

    insights.push({
      id: 'insight-strategy',
      title: `Break down "${biggest.name}"`,
      description: `At ~${biggest.estimatedMinutes} minutes, try splitting into ${chunks} sessions of 30 min each. Steady progress beats last-minute cramming.`,
      type: 'strategy',
    });
  }

  // 3. Encouragement: completed count
  const total = body.assignments.length;
  const doneCount = completed.length;

  if (total > 0 && doneCount > 0) {
    const percent = Math.round((doneCount / total) * 100);
    insights.push({
      id: 'insight-encouragement',
      title: `${doneCount} assignment${doneCount !== 1 ? 's' : ''} completed`,
      description: `You've finished ${percent}% of your assignments. Keep the momentum going!`,
      type: 'encouragement',
    });
  } else if (total > 0) {
    insights.push({
      id: 'insight-encouragement',
      title: 'Ready to start',
      description: `You have ${incomplete.length} assignment${incomplete.length !== 1 ? 's' : ''} to work on. Knock out the smallest one first for a quick win!`,
      type: 'encouragement',
    });
  } else {
    insights.push({
      id: 'insight-encouragement',
      title: 'All clear',
      description:
        'No assignments tracked yet. Add your upcoming work to get personalized tips.',
      type: 'encouragement',
    });
  }

  return Response.json({ insights });
}
