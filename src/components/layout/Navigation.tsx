'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpen, ClipboardList, MessageSquare, Timer, Zap, Shield, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLastConversation } from '@/hooks/use-last-conversation';

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    subtitle: 'Mission Control',
    icon: LayoutDashboard,
  },
  {
    href: '/courses',
    label: 'Courses',
    subtitle: 'Active Operations',
    icon: BookOpen,
  },
  {
    href: '/assignments',
    label: 'Assignments',
    subtitle: 'Task Tracker',
    icon: ClipboardList,
  },
  {
    href: '/focus',
    label: 'Focus',
    subtitle: 'Deep Work Mode',
    icon: Timer,
  },
  {
    href: '/chat',
    label: 'Chat',
    subtitle: 'AI Strategist',
    icon: MessageSquare,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const lastConversation = useLastConversation();
  const lastConversationId = lastConversation?.id ?? null;

  if (pathname === '/focus') {
    return null;
  }

  return (
    <>
      {/* Desktop: right-side mission control panel */}
      <nav className="hidden lg:flex w-60 shrink-0 flex-col border-l border-border/30 glass-strong">
        {/* Panel header with logo mark */}
        <div className="border-b border-border/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Systems</p>
              <p className="text-[9px] text-muted-foreground/50">Module access</p>
            </div>
          </div>
        </div>

        {/* Nav items — fill all available space equally */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isChat = item.href === '/chat';

            if (isChat) {
              return (
                <div
                  key={item.href}
                  className={cn(
                    'group relative flex flex-1 flex-col rounded-xl overflow-hidden transition-all duration-200',
                    isActive
                      ? 'glass bg-primary/[0.08] ring-1 ring-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.08)]'
                      : 'border border-border/40 bg-muted/10'
                  )}
                >
                  {/* Top row: icon + label */}
                  <div className="flex items-center gap-2.5 p-3 pb-2">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
                      isActive
                        ? 'border-primary/30 bg-primary/15 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                        : 'border-[hsl(var(--focus-purple))]/20 bg-[hsl(var(--focus-purple))]/10'
                    )}>
                      <item.icon className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-primary' : 'text-[hsl(var(--focus-purple))]'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-semibold leading-tight',
                        isActive ? 'text-primary' : 'text-[hsl(var(--focus-purple))]'
                      )}>{item.label}</p>
                      <p className="text-[10px] text-muted-foreground/50">{item.subtitle}</p>
                    </div>
                  </div>

                  {/* Split actions */}
                  <div className="mt-auto grid grid-cols-2 gap-px bg-border/30">
                    <button
                      onClick={() => router.push('/chat')}
                      className="flex items-center justify-center gap-1 bg-background/50 px-2 py-1.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/[0.08]"
                    >
                      <Plus className="h-3 w-3" />
                      New
                    </button>
                    <button
                      onClick={() => {
                        if (lastConversationId) {
                          router.push(`/chat?c=${lastConversationId}`);
                        } else {
                          router.push('/chat');
                        }
                      }}
                      className="flex items-center justify-center gap-1 bg-background/50 px-2 py-1.5 text-[10px] font-medium text-[hsl(var(--focus-purple))] transition-colors hover:bg-[hsl(var(--focus-purple))]/[0.08]"
                    >
                      {lastConversationId ? 'Continue' : 'Start'}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex flex-1 flex-col rounded-xl p-3 transition-all duration-200',
                  isActive
                    ? 'glass bg-primary/[0.08] ring-1 ring-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.08)]'
                    : 'border border-border/40 bg-muted/10 hover:bg-muted/30 hover:border-border/60'
                )}
              >
                {/* Top row: icon + label */}
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
                    isActive
                      ? 'border-primary/30 bg-primary/15 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                      : 'border-border/30 bg-muted/20 group-hover:border-border/50'
                  )}>
                    <item.icon className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-semibold leading-tight',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>{item.label}</p>
                    <p className="text-[10px] text-muted-foreground/50">{item.subtitle}</p>
                  </div>
                </div>

                {/* Status bar — pushed to bottom */}
                <div className="mt-auto flex items-center justify-between rounded-md bg-background/30 px-2 py-1 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isActive ? 'bg-accent shadow-[0_0_6px_hsl(var(--accent)/0.8)] animate-pulse-glow' : 'bg-muted-foreground/30'
                    )} />
                    <span className="text-[10px] text-muted-foreground/60">
                      {isActive ? 'Active' : 'Standby'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* System status footer */}
        <div className="border-t border-border/30 p-3 space-y-3">
          {/* Quick action */}
          <div className="rounded-lg bg-primary/[0.06] p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Quick Focus</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">Start a 25-min session</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted/30">
              <div className="h-full w-0 rounded-full bg-[hsl(var(--focus-purple))]" />
            </div>
          </div>

          {/* System health */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent)/0.6)]" />
                <span className="text-[10px] text-muted-foreground/60">All systems nominal</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground/50">Weekly progress</span>
                <span className="font-medium tabular-nums text-primary">&mdash;</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-primary/60 to-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground/50">Study streak</span>
                <span className="font-medium tabular-nums text-[hsl(var(--warning))]">&mdash;</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-[hsl(var(--warning)/0.6)] to-[hsl(var(--warning))]" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile: bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 glass-strong">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
