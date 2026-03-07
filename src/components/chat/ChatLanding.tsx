'use client';

import { Sparkles, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SuggestedPrompts } from '@/components/chat/SuggestedPrompts';
import { ConversationList } from '@/components/chat/ConversationList';
import type { ChatMessage, Conversation } from '@/lib/types';

export const QUICK_START_MESSAGE = {
  role: 'assistant' as const,
  content:
    "YOOO let's do this!! I'm ready to help you absolutely crush whatever's on your plate. Hit me with your questions, vent about that assignment, or just let me know what's up. No judgment, all vibes. What are we tackling?",
};

interface ChatLandingProps {
  greeting: ChatMessage | null;
  onSendPrompt: (text: string) => void;
  onQuickStart: () => void;
  recentConversations: Conversation[];
  totalConversations: number;
  onSelectConversation: (id: string) => void;
  onViewAll: () => void;
}

export function ChatLanding({
  greeting,
  onSendPrompt,
  onQuickStart,
  recentConversations,
  totalConversations,
  onSelectConversation,
  onViewAll,
}: ChatLandingProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-primary/15 p-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="font-heading text-sm font-semibold text-primary">
          New Conversation
        </span>
      </div>

      {greeting && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex items-start gap-4 p-4">
            <p className="flex-1 text-sm leading-relaxed text-foreground">
              {greeting.content}
            </p>
            <button
              onClick={onQuickStart}
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 transition-colors hover:bg-primary/20"
            >
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-heading text-sm font-bold text-primary">
                Let&apos;s Get to Biznesss
              </span>
            </button>
          </CardContent>
        </Card>
      )}

      <SuggestedPrompts onSelect={onSendPrompt} />

      <ConversationList
        conversations={recentConversations}
        onSelect={onSelectConversation}
        onViewAll={onViewAll}
        showViewAll={totalConversations > 3}
      />
    </div>
  );
}
