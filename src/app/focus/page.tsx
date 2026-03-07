import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw, Coffee } from 'lucide-react';

const presets = [
  { label: '25 min', subtitle: 'Pomodoro', minutes: 25 },
  { label: '50 min', subtitle: 'Deep work', minutes: 50 },
  { label: '15 min', subtitle: 'Quick burst', minutes: 15 },
];


export default function FocusPage() {
  return (
    <div className="animate-fade-in space-y-8 pb-8">
      {/* Exit button */}
      <div className="pt-4 px-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Exit Focus
          </Button>
        </Link>
      </div>

      {/* Centered timer display */}
      <div className="flex flex-col items-center text-center">
        <h2 className="font-heading text-lg font-semibold text-muted-foreground">Focus Mode</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Breathe in. You have one thing to do right now.
        </p>

        {/* Timer circle */}
        <div className="relative mt-8 flex h-56 w-56 items-center justify-center">
          {/* Background ring */}
          <svg className="absolute inset-0" viewBox="0 0 224 224">
            <circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="hsl(var(--focus-purple))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 100}`}
              strokeDashoffset={`${2 * Math.PI * 100 * 0.0}`}
              transform="rotate(-90 112 112)"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="z-10 text-center">
            <p className="font-heading text-5xl font-bold tabular-nums">25:00</p>
            <p className="mt-1 text-sm text-muted-foreground">ready</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Reset timer">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button size="lg" className="gap-2 rounded-full bg-[hsl(var(--focus-purple))] px-8 hover:bg-[hsl(var(--focus-purple))]/90">
            <Play className="h-5 w-5" />
            Start Focus
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Take a break">
            <Coffee className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Timer functionality coming soon</p>
      </div>

      {/* Presets */}
      <div className="mx-auto max-w-sm">
        <h3 className="mb-3 text-center font-heading text-sm font-semibold text-muted-foreground">
          Timer Presets
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <Card
              key={preset.minutes}
              className="animate-card-enter cursor-pointer border-2 border-transparent transition-colors hover:border-[hsl(var(--focus-purple))]/30"
            >
              <CardContent className="p-3 text-center">
                <p className="font-heading text-lg font-bold">{preset.label}</p>
                <p className="text-xs text-muted-foreground">{preset.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
