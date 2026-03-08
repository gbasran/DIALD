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
      createdAt: new Date().toISOString(),
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

  function changeStatus(id: string, newStatus: Assignment['status']) {
    setAssignments((prev) =>
      prev.map((assignment) => {
        if (assignment.id !== id) return assignment;
        const now = new Date().toISOString();
        const updates: Partial<Assignment> = { status: newStatus };

        if (assignment.status === 'todo' && newStatus === 'in-progress') {
          updates.startedAt = now;
        } else if (assignment.status === 'in-progress' && newStatus === 'done') {
          updates.completedAt = now;
        } else if (assignment.status === 'done' && newStatus === 'in-progress') {
          updates.completedAt = undefined;
        } else if (assignment.status === 'in-progress' && newStatus === 'todo') {
          updates.startedAt = undefined;
        } else if (assignment.status === 'todo' && newStatus === 'done') {
          updates.completedAt = now;
          if (!assignment.startedAt) updates.startedAt = now;
        } else if (assignment.status === 'done' && newStatus === 'todo') {
          updates.startedAt = undefined;
          updates.completedAt = undefined;
        }

        return { ...assignment, ...updates };
      })
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

  function addMultipleAssignments(items: Omit<Assignment, 'id'>[]) {
    setAssignments((prev) => [
      ...prev,
      ...items.map((a) => ({
        ...a,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      })),
    ]);
  }

  return {
    assignments,
    isLoaded,
    addAssignment,
    addMultipleAssignments,
    updateAssignment,
    changeStatus,
    deleteAssignment,
    deleteAssignmentsForCourse,
  };
}
