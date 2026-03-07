import { COURSE_COLORS } from '@/lib/types';
import type { Course, Assignment } from '@/lib/types';

export const DEMO_COURSES: Omit<Course, 'id'>[] = [
  {
    code: 'CPSC 2620',
    name: 'Data Structures & Algorithms',
    schedule: [
      { day: 'Monday', startTime: '10:00', endTime: '10:50' },
      { day: 'Wednesday', startTime: '10:00', endTime: '10:50' },
      { day: 'Friday', startTime: '10:00', endTime: '10:50' },
    ],
    location: 'UHall C610',
    color: COURSE_COLORS[0], // Calm blue
  },
  {
    code: 'MATH 2565',
    name: 'Elementary Linear Algebra',
    schedule: [
      { day: 'Tuesday', startTime: '13:00', endTime: '14:15' },
      { day: 'Thursday', startTime: '13:00', endTime: '14:15' },
    ],
    location: 'UHall B660',
    color: COURSE_COLORS[1], // Soft green
  },
  {
    code: 'ENGL 1900',
    name: 'Writing & Research',
    schedule: [
      { day: 'Monday', startTime: '11:00', endTime: '11:50' },
      { day: 'Wednesday', startTime: '11:00', endTime: '11:50' },
      { day: 'Friday', startTime: '11:00', endTime: '11:50' },
    ],
    location: 'UHall A580',
    color: COURSE_COLORS[2], // Gentle purple
  },
  {
    code: 'CPSC 3620',
    name: 'Operating Systems',
    schedule: [
      { day: 'Tuesday', startTime: '09:00', endTime: '10:15' },
      { day: 'Thursday', startTime: '09:00', endTime: '10:15' },
    ],
    location: 'UHall C640',
    color: COURSE_COLORS[3], // Warm amber
  },
];

export function createDemoAssignments(courseIds: string[]): Omit<Assignment, 'id'>[] {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  return [
    {
      courseId: courseIds[0], // CPSC 2620
      name: 'Lab 6 - Binary Trees',
      dueDate: new Date(now + 18 * hour).toISOString(),
      description: 'Implement insert, search, and traversal methods for a binary search tree.',
      status: 'in-progress',
      estimatedMinutes: 90,
    },
    {
      courseId: courseIds[1], // MATH 2565
      name: 'Problem Set 4 - Eigenvalues',
      dueDate: new Date(now + 48 * hour).toISOString(),
      description: 'Compute eigenvalues and eigenvectors for the given matrices.',
      status: 'todo',
      estimatedMinutes: 120,
    },
    {
      courseId: courseIds[2], // ENGL 1900
      name: 'Research Proposal Draft',
      dueDate: new Date(now + 5 * day).toISOString(),
      description: 'Write a 500-word proposal for your final research paper topic.',
      status: 'todo',
      estimatedMinutes: 60,
    },
    {
      courseId: courseIds[3], // CPSC 3620
      name: 'Assignment 3 - Process Scheduling',
      dueDate: new Date(now + 10 * day).toISOString(),
      description: 'Simulate round-robin and priority scheduling algorithms.',
      status: 'todo',
      estimatedMinutes: 150,
    },
    {
      courseId: courseIds[0], // CPSC 2620
      name: 'Lab 5 - Linked Lists',
      dueDate: new Date(now - 2 * day).toISOString(),
      description: 'Implement singly and doubly linked list operations.',
      status: 'done',
      estimatedMinutes: 75,
    },
  ];
}
