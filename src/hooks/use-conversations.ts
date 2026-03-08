'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { STORAGE_KEYS } from '@/lib/types';
import type { Conversation, ChatMessage } from '@/lib/types';

const MAX_CONVERSATIONS = 20;

function generateTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (!firstUserMsg) return 'New conversation';

  const content = firstUserMsg.content.trim();
  if (content.length <= 50) return content;

  // Find last space after position 30, truncate there
  const lastSpace = content.lastIndexOf(' ', 50);
  const cutoff = lastSpace > 30 ? lastSpace : 50;
  return content.slice(0, cutoff) + '...';
}

function pruneConversations(convos: Conversation[]): Conversation[] {
  if (convos.length <= MAX_CONVERSATIONS) return convos;
  return [...convos]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
}

export function useConversations() {
  const [conversations, setConversationsRaw, isLoaded] = useLocalStorage<
    Conversation[]
  >(STORAGE_KEYS.CONVERSATIONS, []);
  const migrationDone = useRef(false);

  // Wrapper that enforces pruning
  const setConversations = useCallback(
    (updater: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
      setConversationsRaw((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev) : updater;
        return pruneConversations(next);
      });
    },
    [setConversationsRaw]
  );

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations]
  );
  const recentConversations = useMemo(() => sorted.slice(0, 3), [sorted]);

  // Migration: move old CHAT_HISTORY data to new format
  useEffect(() => {
    if (!isLoaded || migrationDone.current) return;
    migrationDone.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (!raw) return;

      const oldMessages: ChatMessage[] = JSON.parse(raw);
      if (!Array.isArray(oldMessages) || oldMessages.length === 0) return;

      // Only migrate if conversations list is currently empty
      if (conversations.length > 0) return;

      const now = Date.now();
      const migrated: Conversation = {
        id: crypto.randomUUID(),
        title: generateTitle(oldMessages),
        messages: oldMessages,
        createdAt: oldMessages[0]?.timestamp ?? now,
        updatedAt: oldMessages[oldMessages.length - 1]?.timestamp ?? now,
      };

      setConversations([migrated]);
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    } catch {
      // Invalid old data, skip migration
    }
  }, [isLoaded, conversations.length, setConversations]);

  const createConversation = useCallback(
    (initialMessages?: ChatMessage[]): string => {
      const id = crypto.randomUUID();
      const now = Date.now();
      const newConvo: Conversation = {
        id,
        title: initialMessages ? generateTitle(initialMessages) : '',
        messages: initialMessages ?? [],
        createdAt: now,
        updatedAt: now,
      };
      setConversations((prev) => [...prev, newConvo]);
      return id;
    },
    [setConversations]
  );

  const updateConversation = useCallback(
    (id: string, messages: ChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          // Regenerate title if it's empty or still the default placeholder
          const needsTitle = !c.title || c.title === 'New conversation';
          const title = needsTitle ? generateTitle(messages) : c.title;
          return { ...c, messages, title, updatedAt: Date.now() };
        })
      );
    },
    [setConversations]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
    },
    [setConversations]
  );

  const renameConversation = useCallback(
    (id: string, title: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    },
    [setConversations]
  );

  const searchConversations = useCallback(
    (query: string): Conversation[] => {
      const q = query.toLowerCase();
      return sorted.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    },
    [sorted]
  );

  const clearAllConversations = useCallback(() => {
    setConversations([]);
  }, [setConversations]);

  return {
    conversations: sorted,
    recentConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    renameConversation,
    searchConversations,
    clearAllConversations,
    isLoaded,
  };
}
