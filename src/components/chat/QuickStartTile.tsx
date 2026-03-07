'use client';

import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface QuickStartTileProps {
  onStart: () => void;
}

export const QUICK_START_MESSAGE = {
  role: 'assistant' as const,
  content:
    "YOOO let's do this!! I'm ready to help you absolutely crush whatever's on your plate. Hit me with your questions, vent about that assignment, or just let me know what's up. No judgment, all vibes. What are we tackling?",
};

export function QuickStartTile({ onStart }: QuickStartTileProps) {
  return (
    <Card
      onClick={onStart}
      className="group cursor-pointer border-primary/20 bg-primary/[0.03] transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/15 p-2.5 transition-colors group-hover:bg-primary/25">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-bold text-primary">
            Let&apos;s Get to Biznesss
          </p>
          <p className="text-xs text-muted-foreground">
            Start a new conversation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
