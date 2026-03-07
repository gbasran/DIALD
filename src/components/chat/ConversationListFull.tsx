'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConversations } from '@/hooks/use-conversations';
import type { Conversation } from '@/lib/types';

interface ConversationListFullProps {
  onSelect: (id: string) => void;
  onBack: () => void;
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

function ConversationItem({
  conversation,
  onSelect,
  onRename,
  onDelete,
}: {
  conversation: Conversation;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <Card className="group animate-card-enter transition-colors hover:bg-muted/50">
      <CardContent className="flex items-center gap-3 p-3">
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
          onClick={onSelect}
        >
          <div className="rounded-md bg-muted p-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                  className="w-full rounded border border-border bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <p className="truncate text-sm font-medium">
                  {conversation.title || 'New conversation'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {conversation.messages.length} message
                  {conversation.messages.length !== 1 ? 's' : ''} &middot;{' '}
                  {formatRelativeTime(conversation.updatedAt)}
                </p>
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Rename"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ConversationListFull({
  onSelect,
  onBack,
}: ConversationListFullProps) {
  const {
    conversations,
    searchConversations,
    renameConversation,
    deleteConversation,
  } = useConversations();

  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  const displayed = query.trim()
    ? searchConversations(query.trim())
    : conversations;

  const handleDelete = () => {
    if (deleteTarget) {
      deleteConversation(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="font-heading text-lg font-bold">Conversations</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {query.trim()
            ? 'No conversations match your search'
            : 'No conversations yet. Start one from the chat page!'}
        </p>
      ) : (
        <div className="grid gap-2">
          {displayed.map((convo) => (
            <ConversationItem
              key={convo.id}
              conversation={convo}
              onSelect={() => onSelect(convo.id)}
              onRename={(title) => renameConversation(convo.id, title)}
              onDelete={() => setDeleteTarget(convo)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title || 'this conversation'}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
