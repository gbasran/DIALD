'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { LayoutDashboard, BookOpen, MessageSquare, Timer, Zap, Shield } from 'lucide-react';
import LiquidGlass from 'liquid-glass-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    subtitle: 'Mission Control',
    icon: LayoutDashboard,
    stat: 'LIVE',
    statColor: 'text-accent',
  },
  {
    href: '/courses',
    label: 'Courses',
    subtitle: 'Active Operations',
    icon: BookOpen,
    stat: '4 active',
    statColor: 'text-primary',
  },
  {
    href: '/chat',
    label: 'Chat',
    subtitle: 'AI Strategist',
    icon: MessageSquare,
    stat: 'Ready',
    statColor: 'text-muted-foreground',
  },
  {
    href: '/focus',
    label: 'Focus',
    subtitle: 'Deep Work Mode',
    icon: Timer,
    stat: '25:00',
    statColor: 'text-[hsl(var(--focus-purple))]',
  },
];

const navGlass = {
  displacementScale: 25,
  blurAmount: 0.04,
  saturation: 130,
  aberrationIntensity: 0.8,
  elasticity: 0.1,
  cornerRadius: 12,
};

export function Navigation() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  if (pathname === '/focus') {
    return null;
  }

  return (
    <>
      {/* Desktop: right-side mission control panel */}
      <nav ref={navRef} className="hidden lg:flex w-60 shrink-0 flex-col border-l border-border/40 bg-card/80 dark:bg-card/50 backdrop-blur-sm dark:backdrop-blur-xl">
        {/* Panel header */}
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

        {/* Nav items — fill all space equally */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1 block">
                <LiquidGlass
                  {...navGlass}
                  mouseContainer={navRef}
                  className={cn(
                    'h-full transition-all duration-200',
                    isActive && 'ring-1 ring-primary/25'
                  )}
                >
                  <div className="p-3 h-full flex flex-col">
                    {/* Top row: icon + label */}
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
                        isActive
                          ? 'border-primary/30 bg-primary/15 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                          : 'border-border/30 bg-muted/20'
                      )}>
                        <item.icon className={cn(
                          'h-4 w-4 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground'
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
                      <span className={cn('text-[10px] font-medium', item.statColor)}>
                        {item.stat}
                      </span>
                    </div>
                  </div>
                </LiquidGlass>
              </Link>
            );
          })}
        </div>

        {/* System status footer */}
        <div className="border-t border-border/30 p-3 space-y-3">
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

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent)/0.6)]" />
              <span className="text-[10px] text-muted-foreground/60">All systems nominal</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground/50">Weekly progress</span>
                <span className="font-medium tabular-nums text-primary">85%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-primary/60 to-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground/50">Study streak</span>
                <span className="font-medium tabular-nums text-[hsl(var(--warning))]">7 days</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
                <div className="h-full w-[50%] rounded-full bg-gradient-to-r from-[hsl(var(--warning)/0.6)] to-[hsl(var(--warning))]" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile: bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-card/90 dark:bg-card/60 backdrop-blur-md">
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
