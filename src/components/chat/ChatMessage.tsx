'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export function ChatMessage({ message, isStreaming, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (!isUser && isStreaming && !message.content) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-muted/50 px-4 py-3">
        <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:overflow-x-auto [&_code]:text-sm [&_code]:font-mono [&_p]:leading-relaxed [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
