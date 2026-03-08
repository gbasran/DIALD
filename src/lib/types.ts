export interface ClassTime {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  schedule: ClassTime[];
  location: string;
  color: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  name: string;
  dueDate: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  estimatedMinutes: number;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export const STORAGE_KEYS = {
  COURSES: 'diald-courses',
  ASSIGNMENTS: 'diald-assignments',
  TASKS: 'diald-tasks',
  SESSIONS: 'diald-sessions',
  CHAT_HISTORY: 'diald-chat-history',
  CONVERSATIONS: 'diald-conversations',
  SETTINGS: 'diald-settings',
} as const;

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface StudentContext {
  courses: Array<{
    code: string;
    name: string;
    schedule: Array<{ day: ClassTime['day']; startTime: string; endTime: string }>;
    location: string;
  }>;
  assignments: Array<{
    id: string;
    name: string;
    courseCode: string;
    dueDate: string;
    estimatedMinutes: number;
    status: Assignment['status'];
  }>;
}

export interface WhatNowResult {
  assignmentId: string;
  task: string;
  courseCode: string;
  reason: string;
}

export interface InsightCard {
  id: string;
  title: string;
  description: string;
  type: 'deadline' | 'strategy' | 'encouragement';
}

export interface FocusSession {
  id: string;
  date: string;          // ISO date string (YYYY-MM-DD)
  startTime: string;     // ISO datetime string
  duration: number;      // actual minutes focused
  courseId: string | null;
  assignmentId: string | null;
  completed: boolean;
}

export interface FocusSettings {
  dailyGoalMinutes: number;  // default 150
}

export const COURSE_COLORS = [
  'hsl(199, 70%, 50%)',   // Calm blue
  'hsl(160, 45%, 45%)',   // Soft green
  'hsl(258, 50%, 60%)',   // Gentle purple
  'hsl(38, 75%, 55%)',    // Warm amber
  'hsl(340, 50%, 55%)',   // Soft rose
  'hsl(180, 40%, 45%)',   // Teal
  'hsl(25, 65%, 55%)',    // Warm coral
];
