'use client';

import { useRef, useEffect } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatConversationProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onRetry: () => void;
  onNewChat: () => void;
}

export function ChatConversation({
  messages,
  isStreaming,
  error,
  onSend,
  onRetry,
  onNewChat,
}: ChatConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => {
          const isLastAssistant =
            msg.role === 'assistant' && i === messages.length - 1;
          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              isStreaming={isLastAssistant && isStreaming}
            />
          );
        })}

        {error && (
          <div className="flex justify-start">
            <div className="flex max-w-[85%] items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm">{error}</p>
                <button
                  onClick={onRetry}
                  className="mt-1 flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isStreaming} onNewChat={onNewChat} />
    </div>
  );
}
