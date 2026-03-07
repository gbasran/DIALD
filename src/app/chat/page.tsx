'use client';

import { useChat } from '@/hooks/use-chat';
import { ChatLanding } from '@/components/chat/ChatLanding';
import { ChatConversation } from '@/components/chat/ChatConversation';

export default function ChatPage() {
  const { messages, isStreaming, error, sendMessage, clearChat, retryLast, isLoaded } = useChat();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  // Determine if user has started chatting (has sent at least one message)
  const hasUserMessages = messages.some((m) => m.role === 'user');

  // Landing view: no user messages yet (only auto-greeting or empty)
  if (!hasUserMessages) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">Chat</h2>
          <p className="text-muted-foreground">Your AI study companion</p>
        </div>
        <ChatLanding
          greeting={messages[0] ?? null}
          onSendPrompt={sendMessage}
        />
      </div>
    );
  }

  // Conversation view: user has started chatting
  return (
    <div className="h-full flex flex-col -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
      <ChatConversation
        messages={messages}
        isStreaming={isStreaming}
        error={error}
        onSend={sendMessage}
        onRetry={retryLast}
        onNewChat={clearChat}
      />
    </div>
  );
}
