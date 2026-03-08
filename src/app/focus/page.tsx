'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Square,
  Check,
  Minus,
  Plus,
} from 'lucide-react';
import { useFocusSessions } from '@/hooks/use-focus-sessions';
import { useAssignments } from '@/hooks/use-assignments';
import { useCourses } from '@/hooks/use-courses';
import { formatRelativeDate } from '@/lib/utils';

// --- Types ---

type FocusView = 'setup' | 'timer' | 'celebration';

interface SelectedTask {
  assignmentId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  assignmentName: string;
  estimatedMinutes: number;
}

// --- Constants ---

const COMPLETION_MESSAGES = [
  { heading: 'Crushed it!', body: 'That focus session was solid work.' },
  { heading: 'Well done!', body: 'Your brain just leveled up.' },
  { heading: 'Nice work!', body: 'Every session builds momentum.' },
  { heading: 'You did it!', body: "That's real progress right there." },
  { heading: 'Focused!', body: 'Your future self is grateful.' },
  { heading: 'Stellar!', body: 'Consistency beats intensity every time.' },
];

const CONFETTI_COLORS = [
  '#a78bfa',
  '#c084fc',
  '#818cf8',
  '#f472b6',
  '#34d399',
  '#fbbf24',
];

const DURATION_PRESETS = [
  { label: '15m', subtitle: 'Quick burst', minutes: 15 },
  { label: '25m', subtitle: 'Pomodoro', minutes: 25 },
  { label: '50m', subtitle: 'Deep work', minutes: 50 },
];

const CIRCUMFERENCE = 2 * Math.PI * 100;

// --- Helpers ---

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Component ---

export default function FocusPage() {
  const { addSession, dailyGoalMinutes, setDailyGoal, isLoaded: sessionsLoaded } =
    useFocusSessions();
  const { assignments, isLoaded: assignmentsLoaded, changeStatus } =
    useAssignments();
  const { courses, isLoaded: coursesLoaded } = useCourses();

  // View state machine
  const [view, setView] = useState<FocusView>('setup');

  // Shared state across views
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [duration, setDuration] = useState(25);
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom' | null>(25);
  const [customDuration, setCustomDuration] = useState(30);
  const [devSeconds, setDevSeconds] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Goal editing
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoalMinutes);

  // Celebration state
  const [completionMessage, setCompletionMessage] = useState(COMPLETION_MESSAGES[0]);

  // Refs for timer
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);
  const startTimeRef = useRef<string>('');
  const isRunningRef = useRef(false);
  const durationRef = useRef(25);
  const secondsLeftRef = useRef(25 * 60);
  const selectedTaskRef = useRef<SelectedTask | null>(null);

  // Keep refs in sync
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);
  useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);
  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  // Sync goal input when loaded
  useEffect(() => {
    if (sessionsLoaded) setGoalInput(dailyGoalMinutes);
  }, [sessionsLoaded, dailyGoalMinutes]);

  // Pending assignments grouped by course
  const groupedAssignments = useMemo(() => {
    if (!assignmentsLoaded || !coursesLoaded) return [];
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    const pending = assignments.filter((a) => a.status !== 'done');
    const groups: {
      course: { id: string; name: string; code: string; color: string };
      assignments: typeof pending;
    }[] = [];

    const byCourse = new Map<string, typeof pending>();
    for (const a of pending) {
      const list = byCourse.get(a.courseId) || [];
      list.push(a);
      byCourse.set(a.courseId, list);
    }

    for (const [courseId, courseAssignments] of byCourse) {
      const course = courseMap.get(courseId);
      if (course) {
        groups.push({
          course: {
            id: course.id,
            name: course.name,
            code: course.code,
            color: course.color,
          },
          assignments: courseAssignments,
        });
      }
    }

    return groups;
  }, [assignments, courses, assignmentsLoaded, coursesLoaded]);

  // --- Timer controls ---

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStart = useCallback(() => {
    startTimeRef.current = new Date().toISOString();
    const totalSecs = devSeconds ?? duration * 60;
    setSecondsLeft(totalSecs);
    secondsLeftRef.current = totalSecs;
    endTimeRef.current = Date.now() + totalSecs * 1000;
    setIsRunning(true);
    setIsPaused(false);
    setView('timer');

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      secondsLeftRef.current = remaining;
      if (remaining <= 0) {
        clearTimer();
        setIsRunning(false);
        // Record completed session
        addSession({
          date: new Date().toISOString().split('T')[0],
          startTime: startTimeRef.current,
          duration: durationRef.current,
          courseId: selectedTaskRef.current?.courseId || null,
          assignmentId: selectedTaskRef.current?.assignmentId || null,
          completed: true,
        });
        setCompletionMessage(
          COMPLETION_MESSAGES[
            Math.floor(Math.random() * COMPLETION_MESSAGES.length)
          ]
        );
        setView('celebration');
      }
    }, 250);
  }, [duration, devSeconds, addSession, clearTimer]);

  const handlePause = useCallback(() => {
    clearTimer();
    setIsPaused(true);
    setIsRunning(false);
  }, [clearTimer]);

  const handleResume = useCallback(() => {
    endTimeRef.current = Date.now() + secondsLeftRef.current * 1000;
    setIsRunning(true);
    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      secondsLeftRef.current = remaining;
      if (remaining <= 0) {
        clearTimer();
        setIsRunning(false);
        addSession({
          date: new Date().toISOString().split('T')[0],
          startTime: startTimeRef.current,
          duration: durationRef.current,
          courseId: selectedTaskRef.current?.courseId || null,
          assignmentId: selectedTaskRef.current?.assignmentId || null,
          completed: true,
        });
        setCompletionMessage(
          COMPLETION_MESSAGES[
            Math.floor(Math.random() * COMPLETION_MESSAGES.length)
          ]
        );
        setView('celebration');
      }
    }, 250);
  }, [addSession, clearTimer]);

  const handleReset = useCallback(() => {
    clearTimer();
    setSecondsLeft(durationRef.current * 60);
    secondsLeftRef.current = durationRef.current * 60;
    setIsRunning(false);
    setIsPaused(false);
  }, [clearTimer]);

  const handleStop = useCallback(() => {
    clearTimer();
    const totalSeconds = durationRef.current * 60;
    const elapsedMinutes = Math.round(
      (totalSeconds - secondsLeftRef.current) / 60
    );
    if (elapsedMinutes > 0) {
      addSession({
        date: new Date().toISOString().split('T')[0],
        startTime: startTimeRef.current,
        duration: elapsedMinutes,
        courseId: selectedTaskRef.current?.courseId || null,
        assignmentId: selectedTaskRef.current?.assignmentId || null,
        completed: false,
      });
    }
    setIsRunning(false);
    setIsPaused(false);
    setView('setup');
  }, [addSession, clearTimer]);

  // Cleanup on unmount -- save partial session if running
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (isRunningRef.current || secondsLeftRef.current < durationRef.current * 60) {
        const totalSeconds = durationRef.current * 60;
        const elapsedMinutes = Math.round(
          (totalSeconds - secondsLeftRef.current) / 60
        );
        if (elapsedMinutes > 0 && startTimeRef.current) {
          // Can't call hook addSession from cleanup, save directly
          try {
            const stored = localStorage.getItem('diald-sessions');
            const sessions = stored ? JSON.parse(stored) : [];
            sessions.push({
              id: crypto.randomUUID(),
              date: new Date().toISOString().split('T')[0],
              startTime: startTimeRef.current,
              duration: elapsedMinutes,
              courseId: selectedTaskRef.current?.courseId || null,
              assignmentId: selectedTaskRef.current?.assignmentId || null,
              completed: false,
            });
            localStorage.setItem('diald-sessions', JSON.stringify(sessions));
          } catch {
            // Ignore localStorage errors during cleanup
          }
        }
      }
    };
  }, []);

  // Confetti pieces (must be above early returns to satisfy Rules of Hooks)
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * 360;
        const distance = 80 + Math.random() * 120;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        return {
          x,
          y,
          r: Math.random() * 720,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: Math.random() * 0.3,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view]
  );

  // Duration preset selection
  const selectPreset = (minutes: number) => {
    setDuration(minutes);
    setSelectedPreset(minutes);
  };

  const selectCustom = () => {
    setSelectedPreset('custom');
    setDuration(customDuration);
  };

  const adjustCustom = (delta: number) => {
    const next = Math.max(5, Math.min(120, customDuration + delta));
    setCustomDuration(next);
    if (selectedPreset === 'custom') {
      setDuration(next);
    }
  };

  // Gate on data loading
  if (!sessionsLoaded || !assignmentsLoaded || !coursesLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-[hsl(var(--focus-purple))]" />
      </div>
    );
  }

  // --- SETUP VIEW ---
  if (view === 'setup') {
    return (
      <div className="animate-fade-in mx-auto max-w-lg space-y-6 px-4 pb-8">
        {/* Exit button */}
        <div className="pt-4">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit Focus
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="font-heading text-xl font-semibold">Focus Mode</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What are you working on?
          </p>
        </div>

        {/* Daily goal chip */}
        <div className="flex justify-center">
          {isEditingGoal ? (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Goal:
              </span>
              <button
                onClick={() => {
                  const next = Math.max(5, goalInput - 5);
                  setGoalInput(next);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[3ch] text-center text-sm font-semibold tabular-nums">
                {goalInput}m
              </span>
              <button
                onClick={() => {
                  const next = Math.min(300, goalInput + 5);
                  setGoalInput(next);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-muted hover:bg-muted/80"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={() => {
                  setDailyGoal(goalInput);
                  setIsEditingGoal(false);
                }}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--focus-purple))] text-white"
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingGoal(true)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-[hsl(var(--focus-purple))]/50 hover:text-foreground"
            >
              Goal: {dailyGoalMinutes}m
            </button>
          )}
        </div>

        {/* Task picker */}
        <div className="space-y-3">
          {/* Free focus option */}
          <button
            onClick={() => setSelectedTask(null)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
              selectedTask === null
                ? 'border-[hsl(var(--focus-purple))] bg-[hsl(var(--focus-purple))]/5'
                : 'border-transparent bg-card hover:border-border'
            }`}
          >
            <p className="text-sm font-medium">Free Focus</p>
            <p className="text-xs text-muted-foreground">
              No assignment linked
            </p>
          </button>

          {/* Assignments grouped by course */}
          {groupedAssignments.map((group) => (
            <div key={group.course.id} className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: group.course.color }}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.course.code}
                </span>
              </div>
              {group.assignments.map((assignment) => {
                const isSelected =
                  selectedTask?.assignmentId === assignment.id;
                return (
                  <button
                    key={assignment.id}
                    onClick={() =>
                      setSelectedTask({
                        assignmentId: assignment.id,
                        courseId: group.course.id,
                        courseName: group.course.name,
                        courseCode: group.course.code,
                        courseColor: group.course.color,
                        assignmentName: assignment.name,
                        estimatedMinutes: assignment.estimatedMinutes,
                      })
                    }
                    className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-card'
                        : 'border-transparent bg-card hover:border-border'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: group.course.color }
                        : undefined
                    }
                  >
                    <p className="text-sm font-medium">{assignment.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatRelativeDate(assignment.dueDate)}</span>
                      {assignment.estimatedMinutes > 0 && (
                        <>
                          <span>&middot;</span>
                          <span>~{assignment.estimatedMinutes}m</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {groupedAssignments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No pending assignments. Use free focus above.
            </p>
          )}
        </div>

        {/* Duration presets */}
        <div>
          <h3 className="mb-3 text-center font-heading text-sm font-semibold text-muted-foreground">
            Duration
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_PRESETS.map((preset) => (
              <Card
                key={preset.minutes}
                onClick={() => selectPreset(preset.minutes)}
                className={`cursor-pointer border-2 transition-colors ${
                  selectedPreset === preset.minutes
                    ? 'border-[hsl(var(--focus-purple))]'
                    : 'border-transparent hover:border-[hsl(var(--focus-purple))]/30'
                }`}
              >
                <CardContent className="p-3 text-center">
                  <p className="font-heading text-lg font-bold">
                    {preset.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {preset.subtitle}
                  </p>
                </CardContent>
              </Card>
            ))}
            {/* Custom */}
            <Card
              onClick={selectCustom}
              className={`cursor-pointer border-2 transition-colors ${
                selectedPreset === 'custom'
                  ? 'border-[hsl(var(--focus-purple))]'
                  : 'border-transparent hover:border-[hsl(var(--focus-purple))]/30'
              }`}
            >
              <CardContent className="p-3 text-center">
                {selectedPreset === 'custom' ? (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustCustom(-5);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs hover:bg-muted/80"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-heading text-lg font-bold tabular-nums">
                      {customDuration}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustCustom(5);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs hover:bg-muted/80"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <p className="font-heading text-lg font-bold">...</p>
                )}
                <p className="text-xs text-muted-foreground">Custom</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dev: 5s timer for testing animations */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (devSeconds) {
                  setDevSeconds(null);
                } else {
                  setDevSeconds(5);
                  setSelectedPreset('custom');
                }
              }}
              className={`rounded-full border px-3 py-1 text-xs font-mono transition-colors ${
                devSeconds
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {devSeconds ? `DEV: ${devSeconds}s` : 'DEV: 5s test'}
            </button>
          </div>
        )}

        {/* Start button */}
        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={selectedPreset === null}
            className="gap-2 rounded-full bg-[hsl(var(--focus-purple))] px-10 text-base hover:bg-[hsl(var(--focus-purple))]/90 disabled:opacity-50"
          >
            <Play className="h-5 w-5" />
            Start Focus
          </Button>
        </div>
      </div>
    );
  }

  // --- TIMER VIEW ---
  if (view === 'timer') {
    const totalSeconds = devSeconds ?? duration * 60;
    const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
    const dashOffset = CIRCUMFERENCE * (1 - progress);

    return (
      <div className="animate-fade-in flex h-screen flex-col items-center justify-center px-4">
        {/* SVG ring */}
        <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
          <svg
            className={`absolute inset-0 ${isPaused ? 'animate-[ring-pulse_2s_ease-in-out_infinite]' : ''}`}
            viewBox="0 0 224 224"
          >
            {/* Background ring */}
            <circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="hsl(var(--focus-purple))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 112 112)"
              style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
          </svg>
          {/* Timer display */}
          <div className="z-10 text-center">
            <p className="font-heading text-5xl font-bold tabular-nums">
              {formatTime(secondsLeft)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPaused ? 'paused' : isRunning ? 'focusing' : 'ready'}
            </p>
          </div>
        </div>

        {/* Selected task info */}
        {selectedTask && (
          <div className="mt-6 flex flex-col items-center gap-1">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: selectedTask.courseColor }}
            >
              {selectedTask.courseCode}
            </span>
            <p className="text-sm font-medium">{selectedTask.assignmentName}</p>
            {selectedTask.estimatedMinutes > 0 && (
              <p className="text-xs text-muted-foreground">
                ~{selectedTask.estimatedMinutes}m estimated
              </p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleReset}
            aria-label="Reset timer"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          {isRunning ? (
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-[hsl(var(--focus-purple))] hover:bg-[hsl(var(--focus-purple))]/90"
              onClick={handlePause}
              aria-label="Pause timer"
            >
              <Pause className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-[hsl(var(--focus-purple))] hover:bg-[hsl(var(--focus-purple))]/90"
              onClick={handleResume}
              aria-label="Resume timer"
            >
              <Play className="h-6 w-6" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleStop}
            aria-label="Stop and save"
          >
            <Square className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // --- CELEBRATION VIEW ---
  return (
    <div className="animate-fade-in flex h-screen flex-col items-center justify-center px-4">
      {/* Confetti burst */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {confettiPieces.map((piece, i) => (
          <div
            key={i}
            className="absolute h-2 w-2 rounded-sm"
            style={
              {
                '--x': `${piece.x}px`,
                '--y': `${piece.y}px`,
                '--r': `${piece.r}deg`,
                backgroundColor: piece.color,
                animation: `confetti-burst 1.2s ease-out ${piece.delay}s forwards`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Checkmark animation */}
      <div
        className="relative mb-6"
        style={{ animation: 'celebrate-pop 0.6s ease-out' }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          className="drop-shadow-lg"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="hsl(var(--focus-purple))"
            opacity="0.15"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--focus-purple))"
            strokeWidth="3"
          />
          <path
            d="M24 40 L35 51 L56 30"
            fill="none"
            stroke="hsl(var(--focus-purple))"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48"
            style={{ animation: 'checkmark-draw 0.5s ease-out 0.3s forwards' }}
            strokeDashoffset="48"
          />
        </svg>
      </div>

      {/* Message */}
      <h2 className="font-heading text-3xl font-bold">
        {completionMessage.heading}
      </h2>
      <p className="mt-1 text-muted-foreground">{completionMessage.body}</p>

      {/* Duration */}
      <p className="mt-4 text-lg font-semibold">
        {duration}m focused
        {selectedTask && (
          <span
            className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: selectedTask.courseColor }}
          >
            {selectedTask.courseCode}
          </span>
        )}
      </p>

      {/* Mark as done */}
      {selectedTask && (
        <Button
          variant="outline"
          className="mt-4 gap-2"
          onClick={() => {
            changeStatus(selectedTask.assignmentId, 'done');
            setSelectedTask(null);
          }}
        >
          <Check className="h-4 w-4" />
          Mark as done?
        </Button>
      )}

      {/* Break suggestion */}
      <p className="mt-6 text-sm text-[hsl(var(--accent))]">
        Take a 5-minute break
      </p>

      {/* Continue button */}
      <Button
        className="mt-6 rounded-full bg-[hsl(var(--focus-purple))] px-8 hover:bg-[hsl(var(--focus-purple))]/90"
        onClick={() => {
          setIsRunning(false);
          setIsPaused(false);
          setView('setup');
        }}
      >
        Continue
      </Button>
    </div>
  );
}
