'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SuggestedPrompts } from '@/components/chat/SuggestedPrompts';
import type { ChatMessage } from '@/lib/types';

interface ChatLandingProps {
  greeting: ChatMessage | null;
  onSendPrompt: (text: string) => void;
}

export function ChatLanding({ greeting, onSendPrompt }: ChatLandingProps) {
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
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {greeting.content}
            </p>
          </CardContent>
        </Card>
      )}

      <SuggestedPrompts onSelect={onSendPrompt} />
    </div>
  );
}
