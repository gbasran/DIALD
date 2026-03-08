'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/use-courses';
import { ReviewTable } from '@/components/import/ReviewTable';
import type { ExtractedAssignment } from '@/lib/import-types';
import { Loader2 } from 'lucide-react';

export function MoodleImport() {
  const { courses } = useCourses();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExtractedAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      const res = await fetch('/api/moodle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
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
      setError("Hmm, couldn't reach that calendar. Check the URL and try again.");
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
          setUrl('');
          setWarnings([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-2">
        <label htmlFor="moodle-url" className="text-sm font-medium">
          Moodle Calendar URL
        </label>
        <input
          id="moodle-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste your Moodle calendar URL..."
          className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFetch();
          }}
        />
        <p className="text-[11px] text-muted-foreground/60">
          Find this in Moodle &gt; Calendar &gt; Export Calendar &gt; Get Calendar URL
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

      <Button onClick={handleFetch} disabled={loading || !url.trim()}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Fetching...
          </>
        ) : (
          'Fetch Calendar'
        )}
      </Button>
    </div>
  );
}
