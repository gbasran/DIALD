'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { STORAGE_KEYS } from '@/lib/types';
import type { Assignment } from '@/lib/types';

export function useAssignments() {
  const [assignments, setAssignments, isLoaded] = useLocalStorage<Assignment[]>(
    STORAGE_KEYS.ASSIGNMENTS,
    []
  );

  function addAssignment(data: Omit<Assignment, 'id'>) {
    const newAssignment: Assignment = {
      ...data,
      id: crypto.randomUUID(),
    };
    setAssignments((prev) => [...prev, newAssignment]);
  }

  function updateAssignment(id: string, data: Partial<Assignment>) {
    setAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === id ? { ...assignment, ...data } : assignment
      )
    );
  }

  function deleteAssignment(id: string) {
    setAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
  }

  function deleteAssignmentsForCourse(courseId: string) {
    setAssignments((prev) =>
      prev.filter((assignment) => assignment.courseId !== courseId)
    );
  }

  return {
    assignments,
    isLoaded,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    deleteAssignmentsForCourse,
  };
}
