'use client';

import { useState, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { COURSE_COLORS } from '@/lib/types';
import type { ExtractedAssignment, ExtractedCourse } from '@/lib/import-types';
import { Check, AlertTriangle, ArrowLeft } from 'lucide-react';

interface ReviewTableProps {
  assignments?: ExtractedAssignment[];
  courses?: ExtractedCourse[];
  mode: 'assignments' | 'courses' | 'mixed';
  onReset: () => void;
}

export function ReviewTable({ assignments: propAssignments, courses: propCourses, mode, onReset }: ReviewTableProps) {
  const { courses: existingCourses, addMultipleCourses } = useCourses();
  const { assignments: existingAssignments, addMultipleAssignments } = useAssignments();

  const [editedAssignments, setEditedAssignments] = useState<ExtractedAssignment[]>([]);
  const [editedCourses, setEditedCourses] = useState<ExtractedCourse[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<number>>(new Set());
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);

  // Initialize and run duplicate detection
  useEffect(() => {
    const aList = (propAssignments ?? []).map((a) => {
      const isDup = existingAssignments.some((existing) => {
        const nameMatch = existing.name.toLowerCase() === a.name.toLowerCase();
        if (!nameMatch) return false;
        const diff = Math.abs(new Date(existing.dueDate).getTime() - new Date(a.dueDate).getTime());
        return diff < 24 * 60 * 60 * 1000;
      });
      return { ...a, isDuplicate: isDup };
    });
    setEditedAssignments(aList);
    setSelectedAssignments(new Set(aList.map((a, i) => (a.isDuplicate ? -1 : i)).filter((i) => i >= 0)));

    const cList = (propCourses ?? []).map((c) => {
      const isDup = existingCourses.some(
        (existing) => existing.code.toLowerCase() === c.code.toLowerCase()
      );
      return { ...c, isDuplicate: isDup };
    });
    setEditedCourses(cList);
    setSelectedCourses(new Set(cList.map((c, i) => (c.isDuplicate ? -1 : i)).filter((i) => i >= 0)));
  }, [propAssignments, propCourses, existingAssignments, existingCourses]);

  const toggleAssignment = useCallback((idx: number) => {
    setSelectedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const toggleCourse = useCallback((idx: number) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  function updateAssignmentField(idx: number, field: keyof ExtractedAssignment, value: string | number) {
    setEditedAssignments((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  }

  function updateCourseField(idx: number, field: keyof ExtractedCourse, value: string) {
    setEditedCourses((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  }

  function handleSave() {
    const selectedCourseList = editedCourses.filter((_, i) => selectedCourses.has(i));
    const selectedAssignmentList = editedAssignments.filter((_, i) => selectedAssignments.has(i));

    // Save courses first
    if (selectedCourseList.length > 0) {
      const colorOffset = existingCourses.length;
      const newCourses = selectedCourseList.map((c, i) => ({
        name: c.name,
        code: c.code,
        location: c.location,
        schedule: c.schedule,
        color: COURSE_COLORS[(colorOffset + i) % COURSE_COLORS.length],
      }));
      addMultipleCourses(newCourses);
    }

    // Save assignments -- look up courseId from existing + newly created courses
    if (selectedAssignmentList.length > 0) {
      // Build a map of course code -> courseId (existing courses + newly added will be found by code)
      // Since addMultipleCourses is async in terms of state, we read existing courses at this point
      // For newly created courses that aren't in state yet, we need to match by code
      const allCourses = [
        ...existingCourses,
        ...selectedCourseList.map((c, i) => ({
          id: `pending-${i}`,
          name: c.name,
          code: c.code,
          location: c.location,
          schedule: c.schedule,
          color: COURSE_COLORS[(existingCourses.length + i) % COURSE_COLORS.length],
        })),
      ];
      const courseByCode = new Map(allCourses.map((c) => [c.code.toLowerCase(), c.id]));

      const newAssignments = selectedAssignmentList.map((a) => ({
        courseId: courseByCode.get(a.courseCode.toLowerCase()) ?? '',
        name: a.name,
        dueDate: a.dueDate,
        description: a.description,
        status: 'todo' as const,
        estimatedMinutes: a.estimatedMinutes,
      }));
      addMultipleAssignments(newAssignments);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onReset();
    }, 1800);
  }

  const totalSelected = selectedAssignments.size + selectedCourses.size;
  const totalItems = editedAssignments.length + editedCourses.length;

  if (saved) {
    const courseCount = editedCourses.filter((_, i) => selectedCourses.has(i)).length;
    const assignmentCount = editedAssignments.filter((_, i) => selectedAssignments.has(i)).length;
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="rounded-full bg-accent/20 p-3 mb-3">
          <Check className="h-6 w-6 text-accent" />
        </div>
        <p className="text-sm font-medium">
          Imported {courseCount > 0 ? `${courseCount} course${courseCount !== 1 ? 's' : ''}` : ''}
          {courseCount > 0 && assignmentCount > 0 ? ' and ' : ''}
          {assignmentCount > 0 ? `${assignmentCount} assignment${assignmentCount !== 1 ? 's' : ''}` : ''}!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Courses section */}
      {(mode === 'courses' || mode === 'mixed') && editedCourses.length > 0 && (
        <div>
          {mode === 'mixed' && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              Courses ({editedCourses.length})
            </p>
          )}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="w-8 p-2" />
                  <th className="p-2 text-left font-medium text-muted-foreground">Code</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Location</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Schedule</th>
                  <th className="w-8 p-2" />
                </tr>
              </thead>
              <tbody>
                {editedCourses.map((course, idx) => (
                  <tr key={idx} className={`border-b border-border/20 ${course.isDuplicate ? 'bg-amber-500/5' : ''}`}>
                    <td className="p-2 text-center">
                      <Checkbox
                        checked={selectedCourses.has(idx)}
                        onCheckedChange={() => toggleCourse(idx)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={course.code}
                        onChange={(e) => updateCourseField(idx, 'code', e.target.value)}
                        className="w-full rounded border border-border/30 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={course.name}
                        onChange={(e) => updateCourseField(idx, 'name', e.target.value)}
                        className="w-full rounded border border-border/30 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="p-2 text-muted-foreground">{course.location || '--'}</td>
                    <td className="p-2 text-muted-foreground">
                      {course.schedule.map((s) => `${s.day.slice(0, 3)} ${s.startTime}-${s.endTime}`).join(', ')}
                    </td>
                    <td className="p-2">
                      {course.isDuplicate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Dup
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignments section */}
      {(mode === 'assignments' || mode === 'mixed') && editedAssignments.length > 0 && (
        <div>
          {mode === 'mixed' && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              Assignments ({editedAssignments.length})
            </p>
          )}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="w-8 p-2" />
                  <th className="p-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Course</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Est. Min</th>
                  <th className="w-8 p-2" />
                </tr>
              </thead>
              <tbody>
                {editedAssignments.map((assignment, idx) => (
                  <tr key={idx} className={`border-b border-border/20 ${assignment.isDuplicate ? 'bg-amber-500/5' : ''}`}>
                    <td className="p-2 text-center">
                      <Checkbox
                        checked={selectedAssignments.has(idx)}
                        onCheckedChange={() => toggleAssignment(idx)}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={assignment.name}
                        onChange={(e) => updateAssignmentField(idx, 'name', e.target.value)}
                        className="w-full rounded border border-border/30 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={assignment.dueDate.slice(0, 10)}
                        onChange={(e) => updateAssignmentField(idx, 'dueDate', e.target.value)}
                        className="rounded border border-border/30 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={assignment.courseCode}
                        onChange={(e) => updateAssignmentField(idx, 'courseCode', e.target.value)}
                        className="w-full rounded border border-border/30 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={assignment.estimatedMinutes}
                        onChange={(e) => updateAssignmentField(idx, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                        className="w-16 rounded border border-border/30 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="p-2">
                      {assignment.isDuplicate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Dup
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          {totalSelected} of {totalItems} selected
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs h-7">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
          <Button size="sm" onClick={handleSave} disabled={totalSelected === 0} className="text-xs h-7">
            Save Selected
          </Button>
        </div>
      </div>
    </div>
  );
}
