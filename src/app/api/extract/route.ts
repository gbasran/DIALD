import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/rate-limit';
import { GEMINI_MODEL } from '@/lib/constants';

type ExtractionType = 'syllabus' | 'crowdmark' | 'bridge';

const VALID_TYPES: ExtractionType[] = ['syllabus', 'crowdmark', 'bridge'];

const MAX_TEXT_LENGTH = 10000;

function buildSyllabusPrompt(
  text: string,
  existingCourses?: Array<{ code: string; name: string }>
): string {
  const courseContext = existingCourses?.length
    ? `\nEXISTING COURSES (for reference):\n${existingCourses.map((c) => `- ${c.code}: ${c.name}`).join('\n')}\n`
    : '';

  return `Extract course and assignment information from this syllabus text.
${courseContext}
Extract:
1. The course name and course code (e.g., "CPSC 3660")
2. All assignments, exams, quizzes, labs, or deliverables with:
   - name: the assignment/exam name
   - dueDate: due date in ISO format (YYYY-MM-DD). If only a month/week is given, estimate the date.
   - description: brief description if available, otherwise empty string
   - estimatedMinutes: estimated time to complete (60 for assignments, 120 for exams/projects, 30 for quizzes)

Return JSON: { "courseCode": "DEPT 1234", "courseName": "Course Title", "assignments": [{ "name": string, "dueDate": "YYYY-MM-DD", "courseCode": "DEPT 1234", "description": string, "estimatedMinutes": number }] }

SYLLABUS TEXT:
${text}`;
}

function buildCrowdmarkPrompt(
  text: string,
  existingCourses?: Array<{ code: string; name: string }>
): string {
  const courseContext = existingCourses?.length
    ? `\nEXISTING COURSES (for reference):\n${existingCourses.map((c) => `- ${c.code}: ${c.name}`).join('\n')}\n`
    : '';

  return `Extract assignment information from this Crowdmark email or notification text.
${courseContext}
Extract all assignments, exams, or assessments mentioned with:
- name: the assignment/exam name
- dueDate: due date in ISO format (YYYY-MM-DD)
- courseCode: the course code if mentioned (e.g., "CPSC 3660")
- description: any additional details, otherwise empty string
- estimatedMinutes: estimated time (60 for assignments, 120 for exams, 30 for quizzes)

Return JSON: { "courseCode": "DEPT 1234", "courseName": "Course Title", "assignments": [{ "name": string, "dueDate": "YYYY-MM-DD", "courseCode": "DEPT 1234", "description": string, "estimatedMinutes": number }] }

EMAIL/NOTIFICATION TEXT:
${text}`;
}

function buildBridgePrompt(text: string): string {
  return `Extract course and exam information from this Bridge (University of Lethbridge) class schedule text.

INPUT FORMAT EXAMPLE:
Foundations of Data Science and AI in Python | Data Science 4850 Section A | Class Begin: 01/07/2026 | Class End: 04/23/2026
01/07/2026 -- 04/13/2026   Tuesday,Thursday   09:00 AM - 10:15 AM Type: Class Location: Lethbridge Building: University Hall Room: B772
Instructor: Jason Satel (Primary)
CRN: 11705

RULES:
1. Convert full department names to ULeth abbreviations:
   "Computer Science" -> "CPSC", "Mathematics" -> "MATH", "Data Science" -> "DATA",
   "English" -> "ENGL", "Kinesiology" -> "KINE", "Physics" -> "PHYS",
   "Chemistry" -> "CHEM", "Biology" -> "BIOL", "Psychology" -> "PSYC",
   "Philosophy" -> "PHIL", "Economics" -> "ECON", "Political Science" -> "POLI",
   "Sociology" -> "SOCI", "Art" -> "ART", "Music" -> "MUSI",
   "History" -> "HIST", "Geography" -> "GEOG", "Neuroscience" -> "NEUR",
   "New Media" -> "NMED"
2. Type: Class rows = weekly recurring schedule entries. Extract day names and convert times to 24h "HH:MM" format.
3. Type: Exam rows = one-off assignments with the exam date as dueDate and estimatedMinutes: 120.
   Name format: "DEPT 1234 Final Exam" or "DEPT 1234 Midterm Exam".
4. Multi-row courses (lecture + lab/tutorial with same course code) = ONE course with MULTIPLE schedule entries.
5. Extract location as "Building Room" (e.g., "University Hall B772").
6. Course name is the descriptive title (e.g., "Foundations of Data Science and AI in Python"), NOT the department + number.

Return JSON:
{
  "courses": [{
    "code": "DEPT 1234",
    "name": "Full Course Title",
    "location": "Building Room",
    "schedule": [{
      "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
      "startTime": "HH:MM",
      "endTime": "HH:MM"
    }]
  }],
  "assignments": [{
    "name": "DEPT 1234 Final Exam",
    "dueDate": "YYYY-MM-DD",
    "courseCode": "DEPT 1234",
    "description": "Final exam",
    "estimatedMinutes": 120
  }]
}

BRIDGE SCHEDULE TEXT:
${text}`;
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

  if (!checkRateLimit(ip, 10)) {
    return Response.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  let body: {
    text?: string;
    type?: string;
    existingCourses?: Array<{ code: string; name: string }>;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, type, existingCourses } = body;

  // Validate text
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return Response.json(
      { error: 'Paste some text to extract from.' },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json(
      { error: `That's a lot of text! Try pasting a smaller section (max ${MAX_TEXT_LENGTH} characters).` },
      { status: 400 }
    );
  }

  // Validate type
  if (!type || !VALID_TYPES.includes(type as ExtractionType)) {
    return Response.json(
      { error: `Invalid extraction type. Must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Build type-specific prompt
  let prompt: string;
  switch (type as ExtractionType) {
    case 'syllabus':
      prompt = buildSyllabusPrompt(text, existingCourses);
      break;
    case 'crowdmark':
      prompt = buildCrowdmarkPrompt(text, existingCourses);
      break;
    case 'bridge':
      prompt = buildBridgePrompt(text);
      break;
  }

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
    // Strip markdown fences as safety fallback
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch (error) {
    console.error('Extract error:', error);
    return Response.json(
      { error: "Couldn't make sense of that text. Try pasting again or a different section." },
      { status: 500 }
    );
  }
}
