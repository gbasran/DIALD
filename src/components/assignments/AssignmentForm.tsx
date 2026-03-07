'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCourses } from '@/hooks/use-courses';
import type { Assignment } from '@/lib/types';

interface AssignmentFormProps {
  initialData?: Assignment;
  onSubmit: (data: Omit<Assignment, 'id'>) => void;
  onCancel: () => void;
}

export function AssignmentForm({ initialData, onSubmit, onCancel }: AssignmentFormProps) {
  const { courses } = useCourses();

  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Assignment['status']>('todo');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCourseId(initialData.courseId);
      // Convert ISO string to datetime-local format
      const dt = new Date(initialData.dueDate);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDueDate(local);
      setEstimatedMinutes(initialData.estimatedMinutes);
      setDescription(initialData.description);
      setStatus(initialData.status);
    } else if (courses.length > 0 && !courseId) {
      setCourseId(courses[0].id);
    }
  }, [initialData, courses, courseId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      courseId,
      dueDate: new Date(dueDate).toISOString(),
      estimatedMinutes,
      description: description.trim(),
      status,
    });
  }

  const selectClass =
    'h-9 w-full rounded-md border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="assignment-name">Name</Label>
        <Input
          id="assignment-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lab 6 - Binary Trees"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-course">Course</Label>
        <select
          id="assignment-course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className={selectClass}
          required
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} — {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-due">Due Date</Label>
        <Input
          id="assignment-due"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-time">Estimated Time (minutes)</Label>
        <Input
          id="assignment-time"
          type="number"
          min={5}
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-description">Description</Label>
        <Input
          id="assignment-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes about this assignment"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-status">Status</Label>
        <select
          id="assignment-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Assignment['status'])}
          className={selectClass}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Save Changes' : 'Add Assignment'}
        </Button>
      </div>
    </form>
  );
}
