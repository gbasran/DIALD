'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { useConversations } from '@/hooks/use-conversations';
import type { ChatMessage, StudentContext } from '@/lib/types';

const MAX_MESSAGES = 100;

function buildStudentContext(
  courses: ReturnType<typeof useCourses>['courses'],
  assignments: ReturnType<typeof useAssignments>['assignments']
): StudentContext {
  return {
    courses: courses.map((c) => ({
      code: c.code,
      name: c.name,
      schedule: c.schedule.map((s) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      location: c.location,
    })),
    assignments: assignments.map((a) => ({
      id: a.id,
      name: a.name,
      courseCode:
        courses.find((c) => c.id === a.courseId)?.code ?? 'Unknown',
      dueDate: a.dueDate,
      estimatedMinutes: a.estimatedMinutes,
      status: a.status,
    })),
  };
}

function truncateMessages(msgs: ChatMessage[]): ChatMessage[] {
  return msgs.length > MAX_MESSAGES ? msgs.slice(-MAX_MESSAGES) : msgs;
}

function buildGreeting(courses: ReturnType<typeof useCourses>['courses']): string {
  if (courses.length > 0) {
    const otherCount = courses.length - 1;
    const courseRef =
      otherCount > 0
        ? `${courses[0].code} and ${otherCount} other course${otherCount !== 1 ? 's' : ''}`
        : courses[0].code;
    return `Hey! I'm DIALD, your AI study companion. I can see you're taking ${courseRef} this semester. Ask me anything -- from explaining concepts to planning your study sessions. What's on your mind?`;
  }
  return "Hey! I'm DIALD, your AI study companion. Add some courses and I'll help you stay on top of everything. What's on your mind?";
}

export function useChat(conversationId?: string) {
  const {
    conversations,
    createConversation,
    updateConversation,
    isLoaded: conversationsLoaded,
  } = useConversations();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ref tracks the active conversation ID for use inside async callbacks
  // where React state would be stale (streaming, fetch handlers).
  const activeIdRef = useRef<string | null>(conversationId ?? null);
  const abortRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  // Keep a ref with the latest messages so async callbacks avoid stale closures
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const { courses } = useCourses();
  const { assignments } = useAssignments();

  // Initialize once: load existing conversation or inject greeting
  useEffect(() => {
    if (!conversationsLoaded || initialized.current) return;
    initialized.current = true;

    if (conversationId) {
      const existing = conversations.find((c) => c.id === conversationId);
      if (existing) {
        setMessages(existing.messages);
        activeIdRef.current = conversationId;
      }
    } else {
      // New conversation — inject greeting
      const greetingMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: buildGreeting(courses),
        timestamp: Date.now(),
      };
      setMessages([greetingMessage]);
    }

    setIsLoaded(true);
  }, [conversationsLoaded, conversationId, conversations, courses]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Create conversation on first user message if none exists
      let currentId = activeIdRef.current;
      if (!currentId) {
        const initialMessages = [...messagesRef.current, userMessage];
        currentId = createConversation(initialMessages);
        activeIdRef.current = currentId;
      }

      const capturedId = currentId;

      setMessages((prev) => truncateMessages([...prev, userMessage]));
      setIsStreaming(true);
      setError(null);

      const studentContext = buildStudentContext(courses, assignments);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messagesRef.current, userMessage]
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .slice(-10)
              .map((m) => ({ role: m.role, content: m.content })),
            studentContext,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText =
            response.status === 429
              ? 'Too many requests. Please wait a moment.'
              : `Error: ${response.statusText}`;
          setError(errorText);
          setIsStreaming(false);
          if (activeIdRef.current === capturedId) {
            updateConversation(capturedId, [...messagesRef.current, userMessage]);
          }
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError('Failed to read response stream');
          setIsStreaming(false);
          return;
        }

        const assistantId = crypto.randomUUID();
        const decoder = new TextDecoder();
        let accumulated = '';

        setMessages((prev) =>
          truncateMessages([
            ...prev,
            { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
          ])
        );

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (activeIdRef.current !== capturedId) break;

          accumulated += decoder.decode(value, { stream: true });
          const currentContent = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: currentContent } : m
            )
          );
        }

        // Finalize and persist
        if (activeIdRef.current === capturedId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: accumulated, timestamp: Date.now() }
                : m
            )
          );
          // Persist outside the updater — reconstruct from known state
          const allMessages = [...messagesRef.current.filter(m => m.id !== assistantId), userMessage, { id: assistantId, role: 'assistant' as const, content: accumulated, timestamp: Date.now() }];
          updateConversation(capturedId, allMessages);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Request was aborted — not an error
        } else {
          setError('Failed to send message. Please try again.');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [courses, assignments, createConversation, updateConversation]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    activeIdRef.current = null;
    setError(null);
    initialized.current = false;
  }, []);

  const retryLast = useCallback(async () => {
    const current = messagesRef.current;
    const lastUserIndex = [...current]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = current.length - 1 - lastUserIndex;
    const lastUserMessage = current[actualIndex];

    setMessages((prev) => prev.slice(0, actualIndex));
    setError(null);

    await sendMessage(lastUserMessage.content);
  }, [sendMessage]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    retryLast,
    isLoaded,
    activeConversationId: activeIdRef.current,
  };
}
