'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { STORAGE_KEYS } from '@/lib/types';
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

export function useChat() {
  const [messages, setMessages, isLoaded] = useLocalStorage<ChatMessage[]>(
    STORAGE_KEYS.CHAT_HISTORY,
    []
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const greetingInjected = useRef(false);

  const { courses } = useCourses();
  const { assignments } = useAssignments();

  // Auto-greeting on first visit (no API call)
  useEffect(() => {
    if (!isLoaded || greetingInjected.current) return;
    if (messages.length > 0) {
      greetingInjected.current = true;
      return;
    }

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
  }, [isLoaded, messages.length, courses, setMessages]);

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

          accumulated += decoder.decode(value, { stream: true });

          // Update streaming message content
          const currentContent = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: currentContent } : m
            )
          );
        }

        // Finalize
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: accumulated, timestamp: Date.now() }
              : m
          )
        );
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
    [messages, courses, assignments, setMessages]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    greetingInjected.current = false;
  }, [setMessages]);

  const retryLast = useCallback(async () => {
    // Find the last user message
    const lastUserIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastUserMessage = messages[actualIndex];

    // Remove messages from the last user message onward
    setMessages((prev) => prev.slice(0, actualIndex));
    setError(null);

    // Re-send
    await sendMessage(lastUserMessage.content);
  }, [messages, setMessages, sendMessage]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    retryLast,
    isLoaded,
  };
}
