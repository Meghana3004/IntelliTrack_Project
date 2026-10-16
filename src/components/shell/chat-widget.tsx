"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: res.ok ? data.answer : (data.error ?? "Something went wrong.") },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong reaching the assistant." }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-dark-slate/10 bg-app-surface shadow-2xl">
          <div className="flex items-center justify-between bg-dark-slate px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                IT
              </span>
              <div>
                <p className="text-sm font-semibold text-app-bg">IntelliTrack Assistant</p>
                <p className="text-[11px] text-app-bg/50">Answers from your live data</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-app-bg/60 transition hover:bg-app-bg/10 hover:text-app-bg"
              aria-label="Close assistant"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-app-bg px-3 py-3 text-sm">
            {messages.length === 0 && (
              <p className="rounded-lg border border-dashed border-dark-slate/15 bg-app-surface px-3 py-2 text-xs text-foreground/50">
                Ask about open exceptions, SLA breaches, carriers, or patterns.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-left leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-accent text-white"
                      : "rounded-bl-sm border border-dark-slate/10 bg-app-surface text-foreground"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-dark-slate/10 bg-app-surface px-3.5 py-2.5 w-fit">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-dark-slate/10 bg-app-surface p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-dark-slate/15 bg-app-bg px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-accent"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:opacity-90 disabled:opacity-40"
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M3.4 20.6 22 12 3.4 3.4 3 10l13 2-13 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl ring-4 ring-accent/20 transition hover:opacity-90"
        aria-label="Toggle assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V16H5.5A1.5 1.5 0 0 1 4 14.5v-9Z"
          />
        </svg>
      </button>
    </div>
  );
}
