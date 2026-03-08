'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ImportTabs } from '@/components/import/ImportTabs';

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-in px-4 py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="font-heading text-2xl font-bold">Import Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pull in your courses and assignments from external sources
        </p>
      </div>

      <ImportTabs />
    </div>
  );
}
