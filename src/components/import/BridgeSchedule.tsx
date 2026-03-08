'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ReviewTable } from '@/components/import/ReviewTable';
import type { ImportResult } from '@/lib/import-types';
import { Loader2 } from 'lucide-react';

export function BridgeSchedule() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), type: 'bridge' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const data = await res.json();
      setResults({
        courses: data.courses ?? [],
        assignments: data.assignments ?? [],
        warnings: data.warnings,
      });
      setWarnings(data.warnings ?? []);
    } catch {
      setError("Couldn't parse that schedule. Make sure you copied the full table from Bridge.");
    } finally {
      setLoading(false);
    }
  }

  if (results) {
    return (
      <div className="space-y-3 animate-fade-in">
        {warnings.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Heads up:</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600/80 dark:text-amber-400/80">{w}</p>
            ))}
          </div>
        )}
        <ReviewTable
          courses={results.courses}
          assignments={results.assignments}
          mode={results.courses.length > 0 && results.assignments.length > 0 ? 'mixed' : results.courses.length > 0 ? 'courses' : 'assignments'}
          onReset={() => {
            setResults(null);
            setText('');
            setWarnings([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label htmlFor="bridge-text" className="text-sm font-medium">
          Bridge Schedule
        </label>
        <textarea
          id="bridge-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your Bridge schedule here..."
          rows={6}
          className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
        <p className="text-[11px] text-muted-foreground/60">
          Go to Bridge &gt; Registration &gt; View Class &amp; Exam Schedule, select all text, and paste here
        </p>
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
          'Extract Schedule'
        )}
      </Button>
    </div>
  );
}
