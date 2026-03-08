'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { ImportTabs } from '@/components/import/ImportTabs';
import { CleanupDialog } from '@/components/import/CleanupDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { STORAGE_KEYS } from '@/lib/types';

function resetAllData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('diald-whatnow-cache');
  window.location.reload();
}

export default function ImportPage() {
  const [showReset, setShowReset] = useState(false);
  const { courses, updateCourse, deleteCourse } = useCourses();
  const { assignments, updateAssignment } = useAssignments();

  function applyCleanup(result: {
    courses: Array<{ id: string; name?: string; code?: string }>;
    assignments: Array<{
      id: string;
      name?: string;
      courseId?: string;
      description?: string;
      estimatedMinutes?: number;
    }>;
    courseMerges: Array<{
      keepId: string;
      removeIds: string[];
    }>;
  }) {
    // Apply course merges first — reassign assignments then delete duplicates
    for (const merge of result.courseMerges) {
      // Reassign assignments from removed courses to the kept course
      for (const removeId of merge.removeIds) {
        for (const a of assignments) {
          if (a.courseId === removeId) {
            updateAssignment(a.id, { courseId: merge.keepId });
          }
        }
        deleteCourse(removeId);
      }
    }

    // Apply course updates
    for (const c of result.courses) {
      const updates: Record<string, string> = {};
      if (c.name) updates.name = c.name;
      if (c.code) updates.code = c.code;
      if (Object.keys(updates).length > 0) {
        updateCourse(c.id, updates);
      }
    }

    // Apply assignment updates
    for (const a of result.assignments) {
      const updates: Record<string, string | number> = {};
      if (a.name) updates.name = a.name;
      if (a.courseId) updates.courseId = a.courseId;
      if (a.description !== undefined) updates.description = a.description;
      if (a.estimatedMinutes) updates.estimatedMinutes = a.estimatedMinutes;
      if (Object.keys(updates).length > 0) {
        updateAssignment(a.id, updates);
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in px-4 py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Import Data</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pull in your courses and assignments from external sources
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CleanupDialog
              courses={courses}
              assignments={assignments}
              onApply={applyCleanup}
            />
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => setShowReset(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Data
            </Button>
          </div>
        </div>
      </div>

      <ImportTabs />

      <ConfirmDeleteDialog
        open={showReset}
        onOpenChange={setShowReset}
        onConfirm={resetAllData}
        title="Reset all data?"
        description="This will permanently delete all your courses, assignments, conversations, focus sessions, and settings. You'll start completely fresh."
      />
    </div>
  );
}
