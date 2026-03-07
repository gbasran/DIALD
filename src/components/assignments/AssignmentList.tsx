'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { StatusDots } from '@/components/assignments/StatusDots';
import type { Assignment, Course } from '@/lib/types';
import { getUrgencyColor, getUrgencyBorder, formatRelativeDate } from '@/lib/utils';
import { Pencil, Trash2, Clock } from 'lucide-react';

interface AssignmentListProps {
  assignments: Assignment[];
  courses: Course[];
  onEdit: (assignment: Assignment) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Assignment['status']) => void;
}

const CELEBRATION_MESSAGES = [
  'Nice work!',
  'You got this!',
  'One down!',
  'Keep going!',
  'Well done!',
];

export function AssignmentList({
  assignments,
  courses,
  onEdit,
  onDelete,
  onStatusChange,
}: AssignmentListProps) {
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const clearCelebration = useCallback(() => {
    setCelebratingId(null);
  }, []);

  useEffect(() => {
    if (celebratingId) {
      const timer = setTimeout(clearCelebration, 2000);
      return () => clearTimeout(timer);
    }
  }, [celebratingId, clearCelebration]);

  function handleStatusChange(assignment: Assignment, newStatus: Assignment['status']) {
    if (newStatus === 'done' && assignment.status !== 'done') {
      setCelebratingId(assignment.id);
      setCelebrationMsg(
        CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
      );
    }
    onStatusChange(assignment.id, newStatus);
  }

  function getCourse(courseId: string) {
    return courses.find((c) => c.id === courseId);
  }

  // Sort: in-progress first (by due date), then todo (by due date), then done (by due date)
  const statusOrder: Record<Assignment['status'], number> = {
    'in-progress': 0,
    'todo': 1,
    'done': 2,
  };

  const sorted = [...assignments].sort((a, b) => {
    const orderDiff = statusOrder[a.status] - statusOrder[b.status];
    if (orderDiff !== 0) return orderDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center animate-fade-in">
        <p className="text-lg font-heading font-semibold text-foreground">
          No assignments yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Let&apos;s add one! Tap the button above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((assignment) => {
        const course = getCourse(assignment.courseId);
        const isDone = assignment.status === 'done';
        const isInProgress = assignment.status === 'in-progress';
        const isCelebrating = celebratingId === assignment.id;

        const borderClass = isDone
          ? 'border-l-muted-foreground'
          : isInProgress
          ? 'border-l-amber-400'
          : getUrgencyBorder(assignment.dueDate);

        return (
          <div
            key={assignment.id}
            className={`glass glow-border rounded-xl border-l-[3px] ${borderClass} ${
              isDone ? 'opacity-60' : ''
            } relative overflow-hidden`}
            style={{ animation: 'card-enter 0.3s ease-out' }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Status dots */}
              <div className="mt-1 shrink-0">
                <StatusDots
                  status={assignment.status}
                  onStatusChange={(newStatus) => handleStatusChange(assignment, newStatus)}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className={`font-heading font-semibold leading-tight ${
                        isDone ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {assignment.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {course ? `${course.code} — ${course.name}` : 'Unknown Course'}
                    </p>
                  </div>
                  <div className="ml-2 flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(assignment)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingAssignment(assignment)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className={isDone ? 'text-muted-foreground' : getUrgencyColor(assignment.dueDate)}>
                    {formatRelativeDate(assignment.dueDate)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {assignment.estimatedMinutes}min
                  </span>
                </div>
              </div>
            </div>

            {/* Celebration overlay */}
            {isCelebrating && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-accent/10 backdrop-blur-[2px]"
                style={{ animation: 'confetti-fade 2s ease-out forwards' }}
              >
                <div style={{ animation: 'celebrate-pop 0.4s ease-out' }}>
                  <div className="flex flex-col items-center gap-1">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-accent"
                    >
                      <polyline
                        points="4 12 9 17 20 6"
                        strokeDasharray="24"
                        style={{ animation: 'checkmark-draw 0.4s ease-out forwards' }}
                      />
                    </svg>
                    <span className="text-sm font-semibold text-accent">
                      {celebrationMsg}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingAssignment} onOpenChange={() => setDeletingAssignment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {deletingAssignment?.name}
              </span>
              ? This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingAssignment(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingAssignment) onDelete(deletingAssignment.id);
                setDeletingAssignment(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
