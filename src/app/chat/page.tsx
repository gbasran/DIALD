'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
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
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatSkeleton() {
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
      </div>
    </div>
  );
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationParam = searchParams.get('c');

  const [view, setView] = useState<ChatView>(conversationParam ? 'conversation' : 'landing');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(conversationParam ?? undefined);

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
    activeConversationId,
  } = useChat(selectedConversationId);

  // Sync URL param → state when navigating via browser or nav buttons
  const prevParamRef = useRef(conversationParam);
  useEffect(() => {
    const prevParam = prevParamRef.current;
    prevParamRef.current = conversationParam;

    if (conversationParam) {
      setSelectedConversationId(conversationParam);
      setView('conversation');
    } else if (prevParam !== null) {
      // URL changed from /chat?c=xxx to /chat — reset to landing
      clearChat();
      setSelectedConversationId(undefined);
      setView('landing');
    }
  }, [conversationParam, clearChat]);

  // Update the URL when a NEW conversation is created (activeConversationId
  // transitions from null → a value). This only happens on the first message
  // in a fresh chat. We track the previous value via ref so this never fires
  // when navigating away (where activeConversationId goes from "xxx" → null).
  const prevActiveIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevActiveIdRef.current;
    prevActiveIdRef.current = activeConversationId;

    if (
      prev === null &&
      activeConversationId &&
      activeConversationId !== conversationParam
    ) {
      router.replace(`/chat?c=${activeConversationId}`, { scroll: false });
    }
  }, [activeConversationId, conversationParam, router]);

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
    router.push(`/chat?c=${id}`);
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
    router.push(`/chat?c=${newId}`);
  };

  const handleNewChat = () => {
    clearChat();
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
