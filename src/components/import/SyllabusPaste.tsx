'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/use-courses';
import { ReviewTable } from '@/components/import/ReviewTable';
import type { ExtractedAssignment } from '@/lib/import-types';
import { Loader2 } from 'lucide-react';

export function SyllabusPaste() {
  const { courses } = useCourses();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExtractedAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      const type = text.toLowerCase().includes('crowdmark') ? 'crowdmark' : 'syllabus';
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          type,
          existingCourses: courses.map((c) => ({ code: c.code, name: c.name })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const data = await res.json();
      setResults(data.assignments ?? []);
      setWarnings(data.warnings ?? []);
    } catch {
      setError("Couldn't make sense of that text. Try pasting a different section.");
    } finally {
      setLoading(false);
    }
  }

  if (results) {
    return (
      <ReviewTable
        assignments={results}
        mode="assignments"
        onReset={() => {
          setResults(null);
          setText('');
          setWarnings([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label htmlFor="syllabus-text" className="text-sm font-medium">
          Paste Text
        </label>
        <textarea
          id="syllabus-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste syllabus text or Crowdmark email here..."
          rows={6}
          className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground/60">
            Works with syllabus schedules and Crowdmark notification emails
          </p>
          <span className="text-[11px] text-muted-foreground/40">
            {text.length.toLocaleString()} chars
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>
          ))}
        </div>
      )}

      <Button onClick={handleExtract} disabled={loading || !text.trim()}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Extracting...
          </>
        ) : (
          'Extract Assignments'
        )}
      </Button>
    </div>
  );
}
