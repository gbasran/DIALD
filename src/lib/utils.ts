import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Assignment } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type UrgencyLevel = 'critical' | 'warning' | 'soon' | 'calm';

export function getUrgencyLevel(dueDate: string): UrgencyLevel {
  const hoursLeft = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 24) return 'critical';
  if (hoursLeft < 72) return 'warning';
  if (hoursLeft < 168) return 'soon';
  return 'calm';
}

const URGENCY_TEXT: Record<UrgencyLevel, string> = {
  critical: 'text-destructive',
  warning: 'text-[hsl(var(--warning))]',
  soon: 'text-primary',
  calm: 'text-muted-foreground',
};

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critical: 'border-l-destructive',
  warning: 'border-l-[hsl(var(--warning))]',
  soon: 'border-l-primary',
  calm: 'border-l-muted-foreground',
};

export function getUrgencyColor(dueDate: string): string {
  return URGENCY_TEXT[getUrgencyLevel(dueDate)];
}

export function getUrgencyBorder(dueDate: string): string {
  return URGENCY_BORDER[getUrgencyLevel(dueDate)];
}

export function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const due = new Date(dateStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Past dates — non-punitive framing (never tell user how late they are)
  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'Due today';
    if (absDays === 1) return 'Ready to tackle';
    if (absDays <= 3) return 'Waiting for you';
    return 'Ready when you are';
  }

  // Future dates
  if (diffHours < 1) return 'Due very soon';
  if (diffHours < 24) return `In ${Math.round(diffHours)}h`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;

  // Beyond a week — formatted date
  return due.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export const STATUS_ORDER: Record<Assignment['status'], number> = {
  'in-progress': 0,
  'todo': 1,
  'done': 2,
};

export function sortByStatusThenDueDate<T extends { status: Assignment['status']; dueDate: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
