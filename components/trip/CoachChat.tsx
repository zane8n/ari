"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const STARTER_PROMPTS = [
  "What's going well so far?",
  "What should we cut or add?",
  "Are we on track for the budget?",
  "Which day looks the riskiest?",
];

export function CoachChat({ api }: { api: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api }),
  });

  const busy = status === "submitted" || status === "streaming";

  function handleSend(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="flex flex-col gap-3 trip-card px-4 py-4">
      <div>
        <h3 className="font-display text-lg leading-tight font-medium">Trip coach</h3>
        <p className="text-xs text-[var(--t-muted)]">Ask it anything about the budget or itinerary — it sees the live data.</p>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="trip-chip !min-h-[36px] !text-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto py-1">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap px-4 py-2.5 text-sm ${
                  message.role === "user" ? "border border-[rgb(214_184_118/0.4)] bg-[var(--t-sea-soft)] text-[var(--t-ink)]" : "border border-[var(--t-line)] text-[var(--t-ink)]"
                }`}
              >
                {message.parts.map((part, i) => (part.type === "text" ? <span key={i}>{part.text}</span> : null))}
              </div>
            </div>
          ))}
          {status === "submitted" && (
            <div className="flex justify-start">
              <div className=" border border-[var(--t-line)] px-4 py-2.5 text-sm text-[var(--t-muted)]">Thinking…</div>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-red-600">{error?.message ?? "The coach hit a snag — try again."}</p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the coach…"
          disabled={busy}
          className="trip-input min-w-0 flex-1 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="trip-btn trip-btn-primary shrink-0"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
