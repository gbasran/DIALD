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
}

export const STORAGE_KEYS = {
  COURSES: 'diald-courses',
  ASSIGNMENTS: 'diald-assignments',
  TASKS: 'diald-tasks',
  SESSIONS: 'diald-sessions',
  CHAT_HISTORY: 'diald-chat-history',
  SETTINGS: 'diald-settings',
} as const;

export const COURSE_COLORS = [
  'hsl(199, 70%, 50%)',   // Calm blue
  'hsl(160, 45%, 45%)',   // Soft green
  'hsl(258, 50%, 60%)',   // Gentle purple
  'hsl(38, 75%, 55%)',    // Warm amber
  'hsl(340, 50%, 55%)',   // Soft rose
  'hsl(180, 40%, 45%)',   // Teal
  'hsl(25, 65%, 55%)',    // Warm coral
];
