import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/rate-limit';
import { GEMINI_MODEL } from '@/lib/constants';

type ExtractionType = 'syllabus' | 'crowdmark' | 'bridge';

const VALID_TYPES: ExtractionType[] = ['syllabus', 'crowdmark', 'bridge'];

const MAX_TEXT_LENGTH = 50000;

function buildSyllabusPrompt(
  text: string,
  existingCourses?: Array<{ code: string; name: string }>
): string {
  const courseContext = existingCourses?.length
    ? `\nEXISTING COURSES (for reference):\n${existingCourses.map((c) => `- ${c.code}: ${c.name}`).join('\n')}\n`
    : '';

  return `Extract course and assignment information from this university syllabus.
${courseContext}
STEP 1: Extract the course info:
- courseCode: standardized format "DEPT 1234" (e.g., "Computer Science 3660" → "CPSC 3660", "DASC 4850", "MATH-3850" → "MATH 3850")
- courseName: the full course title (expand abbreviations, e.g., "Opt." → "Optimization")
- Convert full department names to ULeth abbreviations: "Computer Science" → "CPSC", "Mathematics" → "MATH", "Data Science" → "DATA", "Music" → "MUSI", "Astronomy" → "ASTR"

STEP 2: Extract assignments, exams, and deliverables that have SPECIFIC DATES.

CRITICAL RULES:
- ONLY extract items that have a specific date or date range in the syllabus. DO NOT invent dates.
- Many syllabuses only say "4-5 assignments worth 20%" or "approx. 10 quizzes" with NO dates. DO NOT create entries for these — skip them entirely.
- For date ranges or exam windows (e.g., "Feb 24-28" or "Jan 29 - Feb 4"), use the LAST date as the dueDate. Include the window in the name, e.g., "Exam 1 (Jan 29 - Feb 4)" not just "Exam 1".
- For items from a class schedule table with a "Deadlines" column, use the date from that row.
- Use the current academic year for dates. If the syllabus says "Winter 2026" or similar, dates like "Feb 12" mean Feb 12, 2026. Do NOT use past years.
- estimatedMinutes: 30 for quizzes/ePolls, 60 for assignments/homework, 90 for labs/projects, 120 for exams/midterms/finals, 180 for final projects.

Return JSON:
{
  "courseCode": "DEPT 1234",
  "courseName": "Full Course Title",
  "assignments": [{ "name": string, "dueDate": "YYYY-MM-DD", "courseCode": "DEPT 1234", "description": string, "estimatedMinutes": number }],
  "warnings": ["Human-readable notes about items WITHOUT dates, e.g., 'CPSC 3660 has 4-5 assignments but no due dates listed'"]
}

The "warnings" array helps the user know what WASN'T imported. Always include a warning for assessment categories that have no dates.

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

  return `Extract assignment information from this Crowdmark course page.
${courseContext}
The first line contains the course info in the format "DEPT-1234-Section-Course Name" (e.g., "MATH-3850-A-Numerical Opt. & Machine Learn").
Convert the department-number format to a course code with a space (e.g., "MATH-3850" -> "MATH 3850").

Below that is a table of assignments with columns: Title, Due date, Status, Score.

IMPORTANT: Only extract assignments where Status is "Not submitted". Skip any assignments with Status "Submitted" — those are already done.

For each non-submitted assignment extract:
- name: the assignment/quiz/exam title
- dueDate: due date in ISO format (YYYY-MM-DD). Parse dates like "Sun, Mar 15, 2026 11:59 PM (Mountain Daylight Time)".
- courseCode: the course code from the header (e.g., "MATH 3850")
- description: empty string
- estimatedMinutes: 60 for assignments, 30 for quizzes, 120 for exams/midterms/finals

Return JSON: { "courseCode": "DEPT 1234", "courseName": "Course Title", "assignments": [{ "name": string, "dueDate": "YYYY-MM-DD", "courseCode": "DEPT 1234", "description": string, "estimatedMinutes": number }], "warnings": ["Notes about skipped items, e.g., 'Skipped 7 submitted assignments'"] }

CROWDMARK COURSE PAGE:
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
