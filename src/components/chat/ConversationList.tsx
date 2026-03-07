'use client';

import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Conversation } from '@/lib/types';

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onViewAll: () => void;
  showViewAll: boolean;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function ConversationList({
  conversations,
  onSelect,
  onViewAll,
  showViewAll,
}: ConversationListProps) {
  if (conversations.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent Conversations
      </h3>
      <div className="grid gap-2">
        {conversations.map((convo) => (
          <Card
            key={convo.id}
            className="animate-card-enter cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onSelect(convo.id)}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <div className="rounded-md bg-muted p-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {convo.title || 'New conversation'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {convo.messages.length} message{convo.messages.length !== 1 ? 's' : ''}{' '}
                  &middot; {formatRelativeTime(convo.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {showViewAll && (
        <button
          onClick={onViewAll}
          className="mt-2 w-full text-center text-xs font-medium text-primary hover:underline"
        >
          View all conversations
        </button>
      )}
    </div>
  );
}
