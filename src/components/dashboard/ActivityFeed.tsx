import { Sparkles } from 'lucide-react';
import type { ActivityEvent } from '@/lib/activity';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="glass glow-border flex-1 rounded-xl p-3 flex flex-col min-h-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Activity</p>
      <div className="space-y-2 flex-1 overflow-hidden">
        {events.length > 0 ? (
          events.slice(0, 3).map((item) => {
            const dotColor = item.action === 'Finished'
              ? 'bg-accent'
              : item.action === 'Started'
              ? 'bg-primary'
              : 'bg-[hsl(var(--warning))]';
            return (
              <div key={item.id} className="flex items-start gap-1.5">
                <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium leading-tight truncate">{item.action}</p>
                  <p className="text-[9px] text-muted-foreground/60 truncate">{item.detail}</p>
                  <p className="text-[9px] text-muted-foreground/40">{item.time}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center">
            <Sparkles className="mx-auto h-4 w-4 text-muted-foreground/30 mb-1" />
            <p className="text-[10px] text-muted-foreground/50">Your activity will show up here</p>
          </div>
        )}
      </div>
    </div>
  );
}
