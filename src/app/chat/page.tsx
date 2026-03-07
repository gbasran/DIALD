'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/hooks/use-chat';
import { useConversations } from '@/hooks/use-conversations';
import { ChatLanding } from '@/components/chat/ChatLanding';
import { ChatConversation } from '@/components/chat/ChatConversation';
import { ConversationListFull } from '@/components/chat/ConversationListFull';
import { QUICK_START_MESSAGE } from '@/components/chat/ChatLanding';
import type { ChatMessage } from '@/lib/types';

type ChatView = 'landing' | 'viewAll' | 'conversation';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationParam = searchParams.get('c');

  const [view, setView] = useState<ChatView>(conversationParam ? 'conversation' : 'landing');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(conversationParam ?? undefined);

  // Handle ?c= param changes (e.g. Continue button from nav)
  useEffect(() => {
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
      setView('conversation');
    }
  }, [conversationParam]);

  const {
    conversations,
    recentConversations,
    createConversation,
    isLoaded: conversationsLoaded,
  } = useConversations();

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    retryLast,
    isLoaded: chatLoaded,
  } = useChat(selectedConversationId);

  // Loading state
  if (!conversationsLoaded || (!chatLoaded && view === 'conversation')) {
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

  // Get the auto-greeting for the landing page display
  const greeting =
    view === 'landing' && messages.length > 0 && messages[0].role === 'assistant'
      ? messages[0]
      : null;

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setView('conversation');
  };

  const handleSendPrompt = (text: string) => {
    setView('conversation');
    sendMessage(text);
  };

  const handleQuickStart = () => {
    const boilerplate: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: QUICK_START_MESSAGE.content,
      timestamp: Date.now(),
    };
    const newId = createConversation([boilerplate]);
    setSelectedConversationId(newId);
    setView('conversation');
  };

  const handleNewChat = () => {
    clearChat();
    setSelectedConversationId(undefined);
    setView('landing');
    router.replace('/chat');
  };

  // View: Full conversation list
  if (view === 'viewAll') {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">Chat</h2>
          <p className="text-muted-foreground">Your AI study companion</p>
        </div>
        <ConversationListFull
          onSelect={handleSelectConversation}
          onBack={() => setView('landing')}
        />
      </div>
    );
  }

  // View: Active conversation
  if (view === 'conversation') {
    return (
      <div className="flex h-full flex-col -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
        <ChatConversation
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          onSend={sendMessage}
          onRetry={retryLast}
          onNewChat={handleNewChat}
        />
      </div>
    );
  }

  // View: Landing
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Chat</h2>
        <p className="text-muted-foreground">Your AI study companion</p>
      </div>
      <ChatLanding
        greeting={greeting}
        onSendPrompt={handleSendPrompt}
        onQuickStart={handleQuickStart}
        recentConversations={recentConversations}
        totalConversations={conversations.length}
        onSelectConversation={handleSelectConversation}
        onViewAll={() => setView('viewAll')}
      />
    </div>
  );
}
