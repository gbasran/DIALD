import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WhatNowCardProps {
  task: string;
  course: string;
  reason: string;
  className?: string;
}

export function WhatNowCard({ task, course, reason, className }: WhatNowCardProps) {
  return (
    <Card className={cn(
      'animate-card-enter border-primary/20 bg-primary/[0.03]',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Suggested Next</span>
            </div>
            <h3 className="font-heading text-xl font-bold leading-snug tracking-tight">{task}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{course}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">{reason}</p>
          </div>
          <Button size="sm" className="ml-4 shrink-0 gap-1.5 rounded-lg">
            Start
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
