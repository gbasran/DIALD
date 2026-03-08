import Link from 'next/link';
import { Upload } from 'lucide-react';

export function ImportButton() {
  return (
    <Link
      href="/import"
      className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
    >
      <Upload className="h-3 w-3" />
      Import
    </Link>
  );
}
