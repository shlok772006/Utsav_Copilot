'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEventStore, getTodayIso } from '@/lib/store/useEventStore';
import { resolveDateHint } from '@/lib/ui/date-hint';
import { Op } from '@/lib/domain/types';

const QUICK_START_CHIPS = [
  {
    label: "Parents' 25th Anniversary",
    prompt:
      "Our parents' 25th anniversary, around 60 people, 3 lakh budget in 5 weeks. Food is most important, simple decor. Some elderly guests.",
  },
  {
    label: 'Engagement Ceremony',
    prompt:
      'Planning an engagement function for 120 guests in Jaipur with an 8 lakh budget in 3 months. Need great photography and festive decor.',
  },
  {
    label: '50th Birthday Party',
    prompt:
      'Organizing a 50th birthday dinner for 40 family members, 1.5 lakh budget next month. Fun evening with DJ and delicious North Indian buffet.',
  },
];

export const IntakeChat: React.FC = () => {
  const {
    state,
    chatMessages,
    isGenerating,
    error,
    addChatMessage,
    applyOpsAction,
    setIsGenerating,
    setError,
  } = useEventStore();

  const [input, setInput] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isGenerating]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : input).trim();
    if (!messageContent || isGenerating) return;

    setError(null);
    setLastFailedMessage(null);
    setInput('');

    // Add user message to UI
    addChatMessage('user', messageContent);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          messages: [
            ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: messageContent },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Server error (${response.status})`
        );
      }

      const data = await response.json();

      // Add assistant reply
      addChatMessage('assistant', data.assistantMessage);

      // Collect ops
      const ops: Op[] = [...(data.stateUpdates || [])];

      // Resolve date_hint deterministically if present
      if (data.date_hint && !ops.some((o) => o.op === 'set_date')) {
        const today = getTodayIso();
        const resolvedDate = resolveDateHint(data.date_hint, today);
        if (resolvedDate) {
          ops.push({ op: 'set_date', value: resolvedDate });
        }
      }

      // Apply ops to state store
      if (ops.length > 0) {
        applyOpsAction(ops, 'Intake update');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach event assistant.';
      setError(message);
      setLastFailedMessage(messageContent);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  return (
    <section
      aria-label="Event Intake Chat"
      className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Utsav Onboarding Assistant
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Live conversation to build your celebration plan
            </p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div
        className="flex-1 p-5 overflow-y-auto space-y-4"
        aria-live="polite"
        role="log"
      >
        {chatMessages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-amber-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-xs border border-stone-200/80 dark:border-stone-700/60 shadow-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    <span>उत्सव Copilot</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-2xl rounded-bl-xs px-4 py-2.5 text-xs flex items-center gap-2 border border-stone-200/80 dark:border-stone-700/60 shadow-xs">
              <span className="inline-block animate-spin">✦</span>
              <span>Reasoning and tailoring your plan...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick-start Chips */}
      {chatMessages.length <= 1 && (
        <div className="px-5 py-2.5 border-t border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/20">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
            Quick start with a celebration scenario:
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_START_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isGenerating}
                className="px-3 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-left cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div
          role="alert"
          className="mx-5 mb-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-sm">⚠</span>
            <span>{error}</span>
          </div>
          {lastFailedMessage && (
            <button
              type="button"
              onClick={handleRetry}
              className="ml-3 px-2.5 py-1 bg-rose-600 text-white rounded-md font-medium hover:bg-rose-700 transition-colors focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex gap-2"
      >
        <label htmlFor="intake-chat-input" className="sr-only">
          Type your event details or ask a question
        </label>
        <input
          id="intake-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Budget 4 lakh, 80 guests in December..."
          disabled={isGenerating}
          className="flex-1 px-4 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 text-stone-900 dark:text-stone-100 placeholder-stone-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isGenerating || !input.trim()}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 cursor-pointer"
        >
          Send
        </button>
      </form>
    </section>
  );
};
