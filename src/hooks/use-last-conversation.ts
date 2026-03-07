'use client';

import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/types';
import type { Conversation } from '@/lib/types';

interface LastConversation {
  id: string;
  time: string;
}

export function useLastConversation(refreshKey?: unknown): LastConversation | null {
  const [last, setLast] = useState<LastConversation | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (raw) {
        const convos: Conversation[] = JSON.parse(raw);
        if (convos.length > 0) {
          const sorted = [...convos].sort((a, b) => b.updatedAt - a.updatedAt);
          setLast({ id: sorted[0].id, time: formatRelativeTime(sorted[0].updatedAt) });
          return;
        }
      }
    } catch { /* no chat history */ }
    setLast(null);
  }, [refreshKey]);

  return last;
}
