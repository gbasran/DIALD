import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UpcomingItem {
  id: string;
  title: string;
  course: string;
  due: string;
  urgency: 'low' | 'medium' | 'high';
}

interface UpcomingPanelProps {
  title: string;
  items: UpcomingItem[];
  className?: string;
}

const urgencyStyles: Record<UpcomingItem['urgency'], string> = {
  low: 'border-l-accent',
  medium: 'border-l-[hsl(var(--warning))]',
  high: 'border-l-destructive',
};

export function UpcomingPanel({ title, items, className }: UpcomingPanelProps) {
  return (
    <Card className={cn('animate-card-enter', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-md border-l-4 bg-muted/50 px-3 py-2',
              urgencyStyles[item.urgency]
            )}
          >
            <p className="text-sm font-medium">{item.title}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.course}</span>
              <span className="text-xs font-medium text-muted-foreground">{item.due}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
