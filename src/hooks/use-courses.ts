'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { STORAGE_KEYS } from '@/lib/types';
import type { Course } from '@/lib/types';

export function useCourses() {
  const [courses, setCourses, isLoaded] = useLocalStorage<Course[]>(
    STORAGE_KEYS.COURSES,
    []
  );

  function addCourse(data: Omit<Course, 'id'>) {
    const newCourse: Course = {
      ...data,
      id: crypto.randomUUID(),
    };
    setCourses((prev) => [...prev, newCourse]);
  }

  function updateCourse(id: string, data: Partial<Course>) {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === id ? { ...course, ...data } : course
      )
    );
  }

  function deleteCourse(id: string) {
    setCourses((prev) => prev.filter((course) => course.id !== id));
  }

  async function loadDemoData() {
    const { DEMO_COURSES } = await import('@/data/demo-data');
    const coursesWithIds: Course[] = DEMO_COURSES.map((course) => ({
      ...course,
      id: crypto.randomUUID(),
    }));
    setCourses(coursesWithIds);
  }

  return { courses, isLoaded, addCourse, updateCourse, deleteCourse, loadDemoData };
}
