import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/rate-limit';
import { GEMINI_MODEL } from '@/lib/constants';

interface CourseInput {
  id: string;
  name: string;
  code: string;
  schedule: Array<{ day: string; startTime: string; endTime: string }>;
  location: string;
  color: string;
}

interface AssignmentInput {
  id: string;
  courseId: string;
  name: string;
  dueDate: string;
  description: string;
  status: string;
  estimatedMinutes: number;
}

const MAX_ITEMS = 200;

function buildCleanupPrompt(
  courses: CourseInput[],
  assignments: AssignmentInput[]
): string {
  return `You are a data cleanup assistant for a student planner app. Review the following courses and assignments and fix any issues.

CURRENT COURSES:
${JSON.stringify(courses.map(c => ({ id: c.id, name: c.name, code: c.code, location: c.location })), null, 2)}

CURRENT ASSIGNMENTS:
${JSON.stringify(assignments.map(a => ({ id: a.id, courseId: a.courseId, name: a.name, dueDate: a.dueDate, description: a.description, estimatedMinutes: a.estimatedMinutes })), null, 2)}

FIX THESE ISSUES:

1. **Duplicate courses**: If multiple courses have the same code (even with different formatting like "MATH-3850" vs "MATH 3850"), keep ONE and note which IDs to merge. The surviving course should have the best name and info.

2. **Course name cleanup**: Expand abbreviations (e.g., "Opt." → "Optimization", "Machine Learn" → "Machine Learning"). Make names title case and professional.

3. **Course code formatting**: Standardize to "DEPT 1234" format (uppercase department, space, number). Fix any dashes or weird formatting.

4. **Orphaned assignments**: If an assignment's courseId doesn't match any course ID, try to match it to a course by code similarity. If no match, leave it.

5. **Assignment name cleanup**: Fix truncated names, expand abbreviations, proper capitalization.

6. **Estimated time**: If estimatedMinutes is 0 or missing, estimate: 30 for quizzes, 60 for assignments/homework, 90 for labs/projects, 120 for exams/midterms/finals.

7. **Description**: If empty and you can infer something useful from the name, add a brief one-liner.

Return JSON:
{
  "changes": ["Human-readable description of each change made"],
  "courses": [{ "id": "existing-id", "name": "Fixed Name", "code": "DEPT 1234" }],
  "assignments": [{ "id": "existing-id", "name": "Fixed Name", "courseId": "correct-course-id", "description": "...", "estimatedMinutes": 60 }],
  "courseMerges": [{ "keepId": "id-to-keep", "removeIds": ["id-to-remove"], "reason": "duplicate" }]
}

RULES:
- Only include courses/assignments that actually changed. Unchanged items should NOT appear in the output.
- Course merges: reassign all assignments from removed course IDs to the kept course ID.
- "changes" array should be short, friendly descriptions like "Expanded 'Opt.' to 'Optimization' in MATH 3850 name"
- If nothing needs fixing, return { "changes": [], "courses": [], "assignments": [], "courseMerges": [] }`;
}

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

  if (!checkRateLimit(ip, 5)) {
    return Response.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  let body: { courses?: CourseInput[]; assignments?: AssignmentInput[] };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { courses = [], assignments = [] } = body;

  if (courses.length === 0 && assignments.length === 0) {
    return Response.json(
      { error: 'Nothing to clean up — add some data first!' },
      { status: 400 }
    );
  }

  if (courses.length + assignments.length > MAX_ITEMS) {
    return Response.json(
      { error: `Too many items (max ${MAX_ITEMS} total).` },
      { status: 400 }
    );
  }

  const prompt = buildCleanupPrompt(courses, assignments);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text ?? '';
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json(
      { error: 'Cleanup failed. Try again in a moment.' },
      { status: 500 }
    );
  }
}
