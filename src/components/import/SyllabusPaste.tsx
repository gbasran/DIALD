'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/use-courses';
import { ReviewTable } from '@/components/import/ReviewTable';
import type { ExtractedAssignment } from '@/lib/import-types';
import { Loader2, FileUp } from 'lucide-react';

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}

export function SyllabusPaste() {
  const { courses } = useCourses();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [results, setResults] = useState<ExtractedAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfs = files.filter((f) => f.type === 'application/pdf');
    if (pdfs.length === 0) {
      setError('Only PDF files are supported.');
      return;
    }
    setPdfLoading(true);
    setError(null);
    setFileName(pdfs.map((f) => f.name).join(', '));
    try {
      const texts = await Promise.all(pdfs.map(extractPdfText));
      setText((prev) => {
        const combined = [prev.trim(), ...texts].filter(Boolean).join('\n\n---\n\n');
        return combined;
      });
    } catch {
      setError("Couldn't read one or more PDFs. Try pasting the text directly instead.");
      setFileName(null);
    } finally {
      setPdfLoading(false);
    }
  }, []);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) handleFiles(files);
    e.target.value = '';
  }

  async function extractChunk(chunk: string) {
    const lower = chunk.toLowerCase();
    const isCrowdmark = lower.includes('crowdmark') ||
      (lower.includes('status') && lower.includes('score') && (lower.includes('submitted') || lower.includes('not submitted')));
    const type = isCrowdmark ? 'crowdmark' : 'syllabus';

    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chunk,
        type,
        existingCourses: courses.map((c) => ({ code: c.code, name: c.name })),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Request failed');
    }

    return res.json();
  }

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      // Split on --- separators (from multi-PDF drops) and process each independently
      const chunks = text.split(/\n\n---\n\n/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const results = await Promise.all(chunks.map(extractChunk));

      // Merge all assignments and warnings
      const allAssignments: ExtractedAssignment[] = [];
      const allWarnings: string[] = [];

      for (const data of results) {
        allAssignments.push(...(data.assignments ?? []));
        allWarnings.push(...(data.warnings ?? []));
      }

      setResults(allAssignments);
      setWarnings(allWarnings);
    } catch {
      setError("Couldn't make sense of that text. Try pasting a different section.");
    } finally {
      setLoading(false);
    }
  }

  if (results) {
    return (
      <div className="space-y-3 animate-fade-in">
        {warnings.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Heads up — some items had no dates:</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600/80 dark:text-amber-400/80">{w}</p>
            ))}
          </div>
        )}
        {results.length === 0 ? (
          <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No items with specific dates found.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">This syllabus might only list assessment weights without due dates.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setResults(null); setText(''); setWarnings([]); setFileName(null); }}>
              Try Another
            </Button>
          </div>
        ) : (
          <ReviewTable
            assignments={results}
            mode="assignments"
            onReset={() => {
              setResults(null);
              setText('');
              setWarnings([]);
              setFileName(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        className="space-y-2"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <label htmlFor="syllabus-text" className="text-sm font-medium">
          Paste Text or Drop PDF
        </label>
        <div className="relative">
          <textarea
            id="syllabus-text"
            value={text}
            onChange={(e) => { setText(e.target.value); setFileName(null); }}
            placeholder="Paste syllabus text, Crowdmark course page, or drop a PDF here..."
            rows={6}
            className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          {dragging && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/5 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FileUp className="h-5 w-5" />
                Drop PDFs here
              </div>
            </div>
          )}
          {pdfLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reading PDF...
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {fileName ? (
              <span className="text-[11px] text-muted-foreground/60">{fileName}</span>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">
                Works with syllabus PDFs, pasted text, and Crowdmark course pages
              </p>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
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

      <Button onClick={handleExtract} disabled={loading || pdfLoading || !text.trim()}>
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
