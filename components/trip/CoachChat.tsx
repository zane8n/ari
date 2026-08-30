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

export function CoachChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/host/trip/coach" }),
  });

  const busy = status === "submitted" || status === "streaming";

  function handleSend(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white px-4 py-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Trip coach</h3>
        <p className="text-xs text-ink-muted">Ask it anything about the budget or itinerary — it sees the live data.</p>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="rounded-full border border-black/15 px-3 py-1.5 text-xs text-ink-muted hover:border-black/30 hover:text-ink"
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
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  message.role === "user" ? "bg-ink text-white" : "border border-black/10 bg-black/[0.02] text-ink"
                }`}
              >
                {message.parts.map((part, i) => (part.type === "text" ? <span key={i}>{part.text}</span> : null))}
              </div>
            </div>
          ))}
          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-ink-muted">Thinking…</div>
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
          className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
