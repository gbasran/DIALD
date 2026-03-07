'use client';

import { useState } from 'react';
import { useCourses } from '@/hooks/use-courses';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CourseForm } from '@/components/courses/CourseForm';
import { CourseList } from '@/components/courses/CourseList';
import type { Course } from '@/lib/types';
import { Plus, Database } from 'lucide-react';

export function CoursesContent() {
  const { courses, isLoaded, addCourse, updateCourse, deleteCourse, loadDemoData } =
    useCourses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  function handleOpenAdd() {
    setEditingCourse(null);
    setIsDialogOpen(true);
  }

  function handleEdit(course: Course) {
    setEditingCourse(course);
    setIsDialogOpen(true);
  }

  function handleSubmit(data: Omit<Course, 'id'>) {
    if (editingCourse) {
      updateCourse(editingCourse.id, data);
    } else {
      addCourse(data);
    }
    setIsDialogOpen(false);
    setEditingCourse(null);
  }

  function handleCancel() {
    setIsDialogOpen(false);
    setEditingCourse(null);
  }

  if (!isLoaded) {
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
          <h2 className="font-heading text-2xl font-bold">Courses</h2>
          <p className="text-muted-foreground">Manage your classes</p>
        </div>
        <div className="flex gap-2">
          {courses.length === 0 && (
            <Button variant="secondary" onClick={loadDemoData}>
              <Database className="h-4 w-4 mr-1" />
              Load Demo Data
            </Button>
          )}
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Course
          </Button>
        </div>
      </div>

      <CourseList
        courses={courses}
        onEdit={handleEdit}
        onDelete={deleteCourse}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Edit Course' : 'Add Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? 'Update your course details below.'
                : 'Fill in the details for your new course.'}
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            key={editingCourse?.id ?? 'new'}
            initialData={editingCourse ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
