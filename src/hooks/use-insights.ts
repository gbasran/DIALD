'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import type { InsightCard } from '@/lib/types';

const FALLBACK_INSIGHT: InsightCard = {
  id: 'fallback',
  title: 'Keep going',
  description: 'Keep going -- every study session counts!',
  type: 'encouragement',
};

export function useInsights() {
  const { courses, isLoaded: coursesLoaded } = useCourses();
  const { assignments, isLoaded: assignmentsLoaded } = useAssignments();
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!assignmentsLoaded || !coursesLoaded) return;
    setIsLoading(true);

    const courseMap = new Map(courses.map(c => [c.id, c]));
    const apiAssignments = assignments.map(a => ({
      name: a.name,
      courseCode: courseMap.get(a.courseId)?.code || 'Unknown',
      dueDate: a.dueDate,
      estimatedMinutes: a.estimatedMinutes,
      status: a.status,
    }));
    const apiCourses = courses.map(c => ({ code: c.code, name: c.name }));

    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: apiAssignments, courses: apiCourses }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: { insights: InsightCard[] }) => setInsights(data.insights))
      .catch(() => setInsights([FALLBACK_INSIGHT]))
      .finally(() => setIsLoading(false));
  }, [assignments, courses, assignmentsLoaded, coursesLoaded]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { insights, isLoading, refresh };
}
