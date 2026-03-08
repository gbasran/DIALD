import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/rate-limit';
import { GEMINI_MODEL } from '@/lib/constants';
import { parseICalEvents } from '@/lib/ical-parser';
import type { ExtractedAssignment } from '@/lib/import-types';

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(ip, 10)) {
    return Response.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  let body: {
    url?: string;
    existingCourses?: Array<{ code: string; name: string }>;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url, existingCourses } = body;

  if (!url || typeof url !== 'string') {
    return Response.json(
      { error: 'A calendar URL is required' },
      { status: 400 }
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return Response.json(
      { error: 'That doesn\'t look like a valid URL. Double-check and try again.' },
      { status: 400 }
    );
  }

  // Fetch iCal URL server-side with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let icsText: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/calendar, text/plain' },
    });

    if (!response.ok) {
      return Response.json(
        { error: `Couldn't reach that calendar (${response.status}). Check the URL and try again.` },
        { status: 502 }
      );
    }

    icsText = await response.text();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return Response.json(
        { error: 'The calendar server took too long to respond. Try again in a moment.' },
        { status: 504 }
      );
    }
    return Response.json(
      { error: 'Couldn\'t fetch that calendar. Check the URL and try again.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  // Parse iCal events
  const events = parseICalEvents(icsText);

  if (events.length === 0) {
    return Response.json({
      assignments: [],
      count: 0,
      warnings: ['No events found in that calendar. Make sure the URL points to an iCal (.ics) feed.'],
    });
  }

  // AI course mapping: if existing courses provided, use Gemini to match events to courses
  let courseMappings: Record<string, string> = {};

  if (existingCourses && existingCourses.length > 0 && events.length > 0) {
    try {
      const mappingPrompt = `Match these calendar events to the student's courses.

EXISTING COURSES:
${existingCourses.map((c) => `- ${c.code}: ${c.name}`).join('\n')}

CALENDAR EVENTS:
${events.map((e) => `- UID: "${e.uid}" | Summary: "${e.summary}" | Categories: ${e.categories.join(', ') || 'none'}`).join('\n')}

For each event, determine which course it belongs to based on the summary text, categories, and course names/codes.

Return JSON: { "mappings": { "event-uid": "COURSE CODE", ... } }
Only include events that clearly match a course. Skip ambiguous ones.`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: mappingPrompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text ?? '';
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      courseMappings = parsed.mappings ?? {};
    } catch {
      // Graceful degradation: if mapping fails, continue without it
    }
  }

  // Convert CalendarEvent[] to ExtractedAssignment[]
  const assignments: ExtractedAssignment[] = events.map((event) => ({
    name: event.summary,
    dueDate: event.start.toISOString(),
    courseCode: courseMappings[event.uid] ||
      (event.categories.length > 0 ? event.categories[0] : ''),
    description: event.description,
    estimatedMinutes: 60,
  }));

  const warnings: string[] = [];
  if (existingCourses && existingCourses.length > 0 && Object.keys(courseMappings).length === 0) {
    warnings.push('Couldn\'t automatically match events to your courses. You can set the course for each item manually.');
  }

  return Response.json({
    assignments,
    count: assignments.length,
    ...(warnings.length > 0 ? { warnings } : {}),
  });
}
