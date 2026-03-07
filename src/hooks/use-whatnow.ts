'use client';

import { useState, useEffect } from 'react';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import type { WhatNowResult } from '@/lib/types';

const CACHE_KEY = 'diald-whatnow-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface WhatNowCache {
  result: WhatNowResult;
  cachedAt: number;
  assignmentHash: string;
}

function computeAssignmentHash(assignments: Array<{ id: string; status: string }>): string {
  return assignments
    .filter(a => a.status !== 'done')
    .map(a => `${a.id}:${a.status}`)
    .sort()
    .join('|');
}

export function useWhatNow() {
  const { courses, isLoaded: coursesLoaded } = useCourses();
  const { assignments, isLoaded: assignmentsLoaded } = useAssignments();
  const [result, setResult] = useState<WhatNowResult | null>(null);

  useEffect(() => {
    if (!assignmentsLoaded || !coursesLoaded) return;
    const hash = computeAssignmentHash(assignments);

    // Check cache
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache: WhatNowCache = JSON.parse(raw);
        if (cache.assignmentHash === hash && Date.now() - cache.cachedAt < CACHE_TTL) {
          setResult(cache.result);
          return;
        }
      }
    } catch { /* invalid cache, refetch */ }

    const courseMap = new Map(courses.map(c => [c.id, c]));
    const apiAssignments = assignments.map(a => ({
      id: a.id,
      name: a.name,
      courseCode: courseMap.get(a.courseId)?.code || 'Unknown',
      dueDate: a.dueDate,
      estimatedMinutes: a.estimatedMinutes,
      status: a.status,
    }));
    const apiCourses = courses.map(c => ({
      code: c.code,
      name: c.name,
      schedule: c.schedule.map(s => ({ day: s.day, startTime: s.startTime, endTime: s.endTime })),
    }));

    fetch('/api/whatnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: apiAssignments, courses: apiCourses }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: WhatNowResult) => {
        setResult(data);
        const cache: WhatNowCache = { result: data, cachedAt: Date.now(), assignmentHash: hash };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      })
      .catch(() => {
        // AI unavailable — result stays null, dashboard falls back to deadline-based
      });
  }, [assignments, courses, assignmentsLoaded, coursesLoaded]);

  return result;
}
