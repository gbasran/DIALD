import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  type: 'study' | 'assignment' | 'achievement' | 'chat';
}

interface ActivityFeedProps {
  title: string;
  items: ActivityItem[];
  className?: string;
}

const typeColors: Record<ActivityItem['type'], string> = {
  study: 'bg-primary',
  assignment: 'bg-[hsl(var(--warning))]',
  achievement: 'bg-accent',
  chat: 'bg-[hsl(var(--focus-purple))]',
};

export function ActivityFeed({ title, items, className }: ActivityFeedProps) {
  return (
    <Card className={cn('animate-card-enter', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', typeColors[item.type])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{item.action}</p>
              <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
