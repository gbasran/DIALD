'use client';

import { useRef, useState, useCallback } from 'react';
import { ArrowUp, Plus } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  onNewChat?: () => void;
}

const MAX_LENGTH = 2000;
const WARN_THRESHOLD = 1500;

export function ChatInput({ onSend, disabled, onNewChat }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, []);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    resetHeight();
  }, [value, disabled, onSend, resetHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_LENGTH) {
      setValue(newValue);
      adjustHeight();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-3">
      <div className="relative flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your courses..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {value.length > WARN_THRESHOLD ? (
          <p className="text-xs text-muted-foreground">
            {value.length}/{MAX_LENGTH}
          </p>
        ) : (
          <div />
        )}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:scale-105 hover:border-primary/30 hover:bg-muted hover:text-foreground hover:shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        )}
      </div>
    </div>
  );
}
