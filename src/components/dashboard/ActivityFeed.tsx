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
            const dotColor = item.action === 'Completed'
              ? 'bg-accent'
              : item.action === 'Started working on'
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
          <p className="text-[10px] text-muted-foreground/50">No activity yet</p>
        )}
      </div>
    </div>
  );
}
