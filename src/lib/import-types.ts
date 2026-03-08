export interface ExtractedAssignment {
  name: string;
  dueDate: string;         // ISO date string
  courseCode: string;       // e.g., "CPSC 3660"
  description: string;
  estimatedMinutes: number;
  isDuplicate?: boolean;    // flagged by client-side duplicate detection
}

export interface ExtractedCourse {
  code: string;             // e.g., "CPSC 3660"
  name: string;             // e.g., "Algorithm Design"
  location: string;         // e.g., "University Hall B772"
  schedule: Array<{
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    startTime: string;      // "HH:MM" 24h format
    endTime: string;
  }>;
  isDuplicate?: boolean;
}

export interface ImportResult {
  courses: ExtractedCourse[];
  assignments: ExtractedAssignment[];
  warnings?: string[];      // partial parse warnings
}
