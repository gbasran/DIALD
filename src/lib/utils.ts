import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUrgencyColor(dueDate: string): string {
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const hoursLeft = (due - now) / (1000 * 60 * 60);

  if (hoursLeft < 24) return 'text-destructive';
  if (hoursLeft < 72) return 'text-[hsl(var(--warning))]';
  if (hoursLeft < 168) return 'text-primary';
  return 'text-muted-foreground';
}

export function getUrgencyBorder(dueDate: string): string {
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const hoursLeft = (due - now) / (1000 * 60 * 60);

  if (hoursLeft < 24) return 'border-l-destructive';
  if (hoursLeft < 72) return 'border-l-[hsl(var(--warning))]';
  if (hoursLeft < 168) return 'border-l-primary';
  return 'border-l-muted-foreground';
}

export function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const due = new Date(dateStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Past dates
  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'Due today';
    if (absDays === 1) return 'Due yesterday';
    return `${absDays} days ago`;
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
