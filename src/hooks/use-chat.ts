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

export function useChat(conversationId?: string) {
  const {
    conversations,
    createConversation,
    updateConversation,
    isLoaded: conversationsLoaded,
  } = useConversations();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(conversationId ?? null);
  const activeConversationRef = useRef<string | null>(
    conversationId ?? null
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const greetingInjected = useRef(false);
  const initDone = useRef(false);

  const { courses } = useCourses();
  const { assignments } = useAssignments();

  // Keep ref in sync
  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  // Initialize: load existing conversation or create new one
  useEffect(() => {
    if (!conversationsLoaded || initDone.current) return;
    initDone.current = true;

    if (conversationId) {
      // Load existing conversation
      const existing = conversations.find((c) => c.id === conversationId);
      if (existing) {
        setMessages(existing.messages);
        setActiveConversationId(conversationId);
        greetingInjected.current = true; // Skip greeting for resumed conversations
      }
    }
    // If no conversationId, we'll inject greeting and create conversation on first message or greeting
    setIsLoaded(true);
  }, [conversationsLoaded, conversationId, conversations]);

  // Auto-greeting for new conversations (no conversationId provided)
  useEffect(() => {
    if (!isLoaded || greetingInjected.current) return;
    if (messages.length > 0) {
      greetingInjected.current = true;
      return;
    }
    // Only inject greeting for new conversations (no conversationId)
    if (conversationId) return;

    greetingInjected.current = true;

    let greeting: string;
    if (courses.length > 0) {
      const otherCount = courses.length - 1;
      const courseRef =
        otherCount > 0
          ? `${courses[0].code} and ${otherCount} other course${otherCount !== 1 ? 's' : ''}`
          : courses[0].code;
      greeting = `Hey! I'm DIALD, your AI study companion. I can see you're taking ${courseRef} this semester. Ask me anything -- from explaining concepts to planning your study sessions. What's on your mind?`;
    } else {
      greeting =
        "Hey! I'm DIALD, your AI study companion. Add some courses and I'll help you stay on top of everything. What's on your mind?";
    }

    const greetingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
    };

    setMessages([greetingMessage]);
  }, [isLoaded, messages.length, courses, conversationId]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // Abort any in-progress stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // If no active conversation yet, create one with greeting + user message
      let currentId = activeConversationRef.current;
      if (!currentId) {
        const initialMessages = [...messages, userMessage];
        currentId = createConversation(initialMessages);
        setActiveConversationId(currentId);
        activeConversationRef.current = currentId;
      }

      const capturedId = currentId;

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        return updated.length > MAX_MESSAGES
          ? updated.slice(-MAX_MESSAGES)
          : updated;
      });

      setIsStreaming(true);
      setError(null);

      const studentContext = buildStudentContext(courses, assignments);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage]
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
          // Still save what we have
          if (activeConversationRef.current === capturedId) {
            updateConversation(capturedId, [...messages, userMessage]);
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

        // Add placeholder assistant message
        setMessages((prev) => {
          const updated = [
            ...prev,
            {
              id: assistantId,
              role: 'assistant' as const,
              content: '',
              timestamp: Date.now(),
            },
          ];
          return updated.length > MAX_MESSAGES
            ? updated.slice(-MAX_MESSAGES)
            : updated;
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Guard: if user switched conversations mid-stream, discard
          if (activeConversationRef.current !== capturedId) break;

          accumulated += decoder.decode(value, { stream: true });

          const currentContent = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: currentContent } : m
            )
          );
        }

        // Finalize and persist
        if (activeConversationRef.current === capturedId) {
          setMessages((prev) => {
            const finalized = prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: accumulated, timestamp: Date.now() }
                : m
            );
            // Persist to conversation storage
            updateConversation(capturedId, finalized);
            return finalized;
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Request was aborted, not an error
        } else {
          setError('Failed to send message. Please try again.');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, courses, assignments, createConversation, updateConversation]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    // Start a new conversation without deleting anything
    setMessages([]);
    setActiveConversationId(null);
    activeConversationRef.current = null;
    setError(null);
    greetingInjected.current = false;
    initDone.current = false;
  }, []);

  const retryLast = useCallback(async () => {
    const lastUserIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastUserMessage = messages[actualIndex];

    setMessages((prev) => prev.slice(0, actualIndex));
    setError(null);

    await sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    retryLast,
    isLoaded,
    activeConversationId,
  };
}
