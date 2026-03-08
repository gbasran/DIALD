'use client';

import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { STORAGE_KEYS } from '@/lib/types';
import type { FocusSession, FocusSettings } from '@/lib/types';

function calculateStreak(sessions: FocusSession[]): {
  current: number;
  best: number;
  weekDots: boolean[];
} {
  const sessionDays = new Set(
    sessions
      .filter((s) => s.completed)
      .map((s) => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk backwards from today counting consecutive days
  let current = 0;
  const check = new Date(today);
  while (sessionDays.has(check.getTime())) {
    current++;
    check.setDate(check.getDate() - 1);
  }

  // Best streak: sort unique days, find longest consecutive run
  const sortedDays = [...sessionDays].sort((a, b) => a - b);
  let best = 0;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (sortedDays[i] - sortedDays[i - 1]) / 86400000;
    run = diff === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  best = Math.max(best, run, current);
  if (sortedDays.length === 0) best = 0;

  // Week dots (Mon-Sun for current week)
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    day.setHours(0, 0, 0, 0);
    return sessionDays.has(day.getTime());
  });

  return { current, best, weekDots };
}

function calculateHourlyDistribution(sessions: FocusSession[]): number[] {
  const buckets = new Array(12).fill(0);
  const todayStr = new Date().toISOString().split('T')[0];

  for (const s of sessions) {
    if (s.date !== todayStr || !s.completed) continue;
    const hour = new Date(s.startTime).getHours();
    const bucketIndex = Math.max(0, Math.min(11, hour - 8)); // 8am = 0, 7pm = 11
    buckets[bucketIndex] += s.duration;
  }
  return buckets;
}

export function useFocusSessions() {
  const [sessions, setSessions, isLoaded] = useLocalStorage<FocusSession[]>(
    STORAGE_KEYS.SESSIONS,
    []
  );
  const [settings, setSettings, settingsLoaded] = useLocalStorage<FocusSettings>(
    STORAGE_KEYS.SETTINGS,
    { dailyGoalMinutes: 150 }
  );

  const dailyGoalMinutes = settings.dailyGoalMinutes;

  const todayMinutes = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions
      .filter((s) => s.completed && s.date === todayStr)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  const weeklyTotal = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return sessions
      .filter((s) => {
        if (!s.completed) return false;
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d >= monday && d <= sunday;
      })
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  const streak = useMemo(() => calculateStreak(sessions), [sessions]);

  const hourlyDistribution = useMemo(
    () => calculateHourlyDistribution(sessions),
    [sessions]
  );

  const goalProgress = useMemo(
    () => Math.min(Math.round((todayMinutes / dailyGoalMinutes) * 100), 100),
    [todayMinutes, dailyGoalMinutes]
  );

  function addSession(session: Omit<FocusSession, 'id'>) {
    const newSession: FocusSession = {
      ...session,
      id: crypto.randomUUID(),
    };
    setSessions((prev) => [...prev, newSession]);
  }

  function setDailyGoal(minutes: number) {
    setSettings({ dailyGoalMinutes: minutes });
  }

  return {
    sessions,
    isLoaded: isLoaded && settingsLoaded,
    addSession,
    todayMinutes,
    weeklyTotal,
    streak,
    hourlyDistribution,
    dailyGoalMinutes,
    goalProgress,
    setDailyGoal,
  };
}
