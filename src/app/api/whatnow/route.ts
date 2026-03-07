import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/rate-limit';
import { GEMINI_MODEL } from '@/lib/constants';

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

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  let body: {
    assignments?: Array<{
      id: string;
      name: string;
      courseCode: string;
      dueDate: string;
      estimatedMinutes: number;
      status: string;
    }>;
    courses?: Array<{
      code: string;
      name: string;
      schedule: Array<{ day: string; startTime: string; endTime: string }>;
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

  const incomplete = body.assignments.filter((a) => a.status !== 'done');
  if (incomplete.length === 0) {
    return Response.json(
      {
        assignmentId: '',
        task: 'You\'re all caught up!',
        courseCode: '',
        reason: 'No pending assignments found. Take a well-deserved break.',
      }
    );
  }

  const now = new Date();
  const prompt = `You are a student productivity advisor. Given the student's assignments and course schedule, determine the single most important task to work on RIGHT NOW.

Current date/time: ${now.toLocaleString()}

ASSIGNMENTS (incomplete):
${incomplete.map((a) => `- ID: ${a.id} | "${a.name}" for ${a.courseCode} | Due: ${a.dueDate} | Est: ${a.estimatedMinutes}min | Status: ${a.status}`).join('\n')}

COURSES:
${body.courses.map((c) => `- ${c.code}: ${c.name} | Schedule: ${c.schedule.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}`).join('\n')}

Consider these factors:
1. Deadline urgency (how soon is it due?)
2. Estimated work time vs available time before deadline
3. Current status (in-progress items may need finishing)

Respond with ONLY valid JSON, no markdown fences:
{"assignmentId": "the-id", "task": "specific action to take now", "courseCode": "COURSE-CODE", "reason": "one concise sentence explaining why this is the priority"}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.text ?? '';
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const result = JSON.parse(cleaned);
    return Response.json(result);
  } catch (error) {
    console.error('WhatNow error:', error);
    return Response.json(
      { error: 'Failed to generate recommendation' },
      { status: 500 }
    );
  }
}
