'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Course, Assignment } from '@/lib/types';

interface CleanupResult {
  changes: string[];
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
    reason: string;
  }>;
}

interface CleanupDialogProps {
  courses: Course[];
  assignments: Assignment[];
  onApply: (result: CleanupResult) => void;
}

type Stage = 'idle' | 'loading' | 'preview' | 'done' | 'error';

export function CleanupDialog({
  courses,
  assignments,
  onApply,
}: CleanupDialogProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasData = courses.length > 0 || assignments.length > 0;

  async function handleOpen() {
    setOpen(true);
    setStage('loading');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses, assignments }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const data: CleanupResult = await res.json();

      if (data.changes.length === 0) {
        setStage('done');
        setResult(data);
      } else {
        setResult(data);
        setStage('preview');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
      setStage('error');
    }
  }

  function handleApply() {
    if (!result) return;
    onApply(result);
    setStage('done');
  }

  function handleClose() {
    setOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStage('idle');
      setResult(null);
      setError(null);
    }, 200);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleOpen}
        disabled={!hasData}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Clean Up
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          {stage === 'loading' && (
            <>
              <DialogHeader>
                <DialogTitle>Tidying things up...</DialogTitle>
                <DialogDescription>
                  Looking at your courses and assignments for anything to fix.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </>
          )}

          {stage === 'preview' && result && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Found {result.changes.length}{' '}
                  {result.changes.length === 1 ? 'thing' : 'things'} to fix
                </DialogTitle>
                <DialogDescription>
                  Here&apos;s what will change. One click to apply.
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-2 max-h-64 overflow-y-auto py-2">
                {result.changes.map((change, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                  >
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Never mind
                </Button>
                <Button onClick={handleApply} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Apply All
                </Button>
              </DialogFooter>
            </>
          )}

          {stage === 'done' && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {result && result.changes.length > 0
                    ? 'All cleaned up!'
                    : 'Already looking good!'}
                </DialogTitle>
                <DialogDescription>
                  {result && result.changes.length > 0
                    ? `Applied ${result.changes.length} ${result.changes.length === 1 ? 'fix' : 'fixes'} to your data.`
                    : "Your courses and assignments don't need any changes right now."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-6">
                <div className="rounded-full bg-green-500/10 p-3">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleClose}>Done</Button>
              </DialogFooter>
            </>
          )}

          {stage === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle>Couldn&apos;t clean up</DialogTitle>
                <DialogDescription>{error}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={handleOpen}>Try Again</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
