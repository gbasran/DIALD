export function DashboardSkeleton() {
  return (
    <div className="flex h-full flex-col animate-fade-in">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">&nbsp;</p>
          <h2 className="font-heading text-xl font-bold tracking-tight">Mission Control</h2>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-2.5 grid-cols-[180px_1fr_1fr]">
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass glow-border rounded-xl p-3 animate-pulse h-[88px]" />
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="glass glow-border rounded-xl p-4 animate-pulse h-[80px]" />
          <div className="glass glow-border rounded-xl p-3.5 animate-pulse flex-1" />
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="glass glow-border rounded-xl p-3.5 animate-pulse h-[200px]" />
          <div className="glass glow-border rounded-xl p-3.5 animate-pulse flex-1" />
        </div>
      </div>
    </div>
  );
}
