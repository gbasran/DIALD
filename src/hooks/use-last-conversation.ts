'use client';

import { useMemo } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { useConversations } from '@/hooks/use-conversations';

interface LastConversation {
  id: string;
  time: string;
}

export function useLastConversation(): LastConversation | null {
  const { conversations, isLoaded } = useConversations();

  return useMemo(() => {
    if (!isLoaded || conversations.length === 0) return null;
    // conversations is already sorted by updatedAt desc
    const latest = conversations[0];
    return { id: latest.id, time: formatRelativeTime(latest.updatedAt) };
  }, [conversations, isLoaded]);
}
