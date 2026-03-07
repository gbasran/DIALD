import { COURSE_COLORS } from '@/lib/types';
import type { Course } from '@/lib/types';

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
