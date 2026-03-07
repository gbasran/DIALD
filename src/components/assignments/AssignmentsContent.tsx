'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAssignments } from '@/hooks/use-assignments';
import { useCourses } from '@/hooks/use-courses';
import { createDemoAssignments } from '@/data/demo-data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { AssignmentList } from '@/components/assignments/AssignmentList';
import { STORAGE_KEYS } from '@/lib/types';
import type { Assignment } from '@/lib/types';
import { Plus, Database, BookOpen } from 'lucide-react';

export function AssignmentsContent() {
  const {
    assignments,
    isLoaded: assignmentsLoaded,
    addAssignment,
    updateAssignment,
    changeStatus,
    deleteAssignment,
  } = useAssignments();
  const {
    courses,
    isLoaded: coursesLoaded,
    loadDemoData: loadDemoCourses,
  } = useCourses();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  function handleOpenAdd() {
    setEditingAssignment(null);
    setIsDialogOpen(true);
  }

  function handleEdit(assignment: Assignment) {
    setEditingAssignment(assignment);
    setIsDialogOpen(true);
  }

  function handleSubmit(data: Omit<Assignment, 'id'>) {
    if (editingAssignment) {
      updateAssignment(editingAssignment.id, data);
    } else {
      addAssignment(data);
    }
    setIsDialogOpen(false);
    setEditingAssignment(null);
  }

  function handleCancel() {
    setIsDialogOpen(false);
    setEditingAssignment(null);
  }

  function handleStatusChange(id: string, status: Assignment['status']) {
    changeStatus(id, status);
  }

  async function handleLoadDemoData() {
    // Load demo courses first if none exist
    let courseIds = courses.map((c) => c.id);
    if (courses.length === 0) {
      await loadDemoCourses();
      // We need to wait for the courses to be available.
      // Since loadDemoData sets state, we read from localStorage directly.
      const stored = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (stored) {
        const parsed = JSON.parse(stored) as { id: string }[];
        courseIds = parsed.map((c) => c.id);
      }
    }
    if (courseIds.length === 0) return;

    const demoAssignments = createDemoAssignments(courseIds);
    for (const assignment of demoAssignments) {
      addAssignment(assignment);
    }
  }

  if (!assignmentsLoaded || !coursesLoaded) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-4 w-48 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground">Manage your tasks</p>
        </div>
        <div className="flex gap-2">
          {assignments.length === 0 && (
            <Button variant="secondary" onClick={handleLoadDemoData}>
              <Database className="h-4 w-4 mr-1" />
              Load Demo Data
            </Button>
          )}
          {courses.length > 0 && (
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Assignment
            </Button>
          )}
        </div>
      </div>

      {courses.length === 0 && assignments.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center animate-fade-in">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-lg font-heading font-semibold text-foreground">
            Add some courses first
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You need at least one course before creating assignments.
          </p>
          <Link href="/courses">
            <Button variant="outline" className="mt-4">
              Go to Courses
            </Button>
          </Link>
        </div>
      )}

      {(courses.length > 0 || assignments.length > 0) && (
        <AssignmentList
          assignments={assignments}
          courses={courses}
          onEdit={handleEdit}
          onDelete={deleteAssignment}
          onStatusChange={handleStatusChange}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? 'Update your assignment details below.'
                : 'Fill in the details for your new assignment.'}
            </DialogDescription>
          </DialogHeader>
          <AssignmentForm
            key={editingAssignment?.id ?? 'new'}
            initialData={editingAssignment ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
