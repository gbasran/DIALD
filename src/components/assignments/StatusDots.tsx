'use client';

import type { Assignment } from '@/lib/types';

interface StatusDotsProps {
  status: Assignment['status'];
  onStatusChange?: (status: Assignment['status']) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}

const STATUSES: { value: Assignment['status']; color: string; label: string }[] = [
  { value: 'todo', color: 'bg-red-500', label: 'To do' },
  { value: 'in-progress', color: 'bg-amber-400', label: 'In progress' },
  { value: 'done', color: 'bg-green-500', label: 'Done' },
];

const SIZE_CLASSES = {
  sm: 'h-2 w-2',
  md: 'h-3.5 w-3.5',
} as const;

export function StatusDots({
  status,
  onStatusChange,
  interactive = true,
  size = 'md',
}: StatusDotsProps) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div role="radiogroup" aria-label="Assignment status" className="flex items-center gap-1">
      {STATUSES.map((s) => {
        const isActive = s.value === status;
        return (
          <span
            key={s.value}
            role="radio"
            tabIndex={interactive ? 0 : undefined}
            aria-checked={isActive}
            aria-label={s.label}
            onClick={() => {
              if (interactive && onStatusChange && s.value !== status) {
                onStatusChange(s.value);
              }
            }}
            onKeyDown={(e) => {
              if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                if (onStatusChange && s.value !== status) onStatusChange(s.value);
              }
            }}
            className={`rounded-full transition-all ${sizeClass} ${s.color} ${
              isActive ? 'opacity-100' : 'opacity-25'
            } ${interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
          />
        );
      })}
    </div>
  );
}
