import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Crown, KeyRound, Mic, Plus, Server, Sparkles, X } from 'lucide-react';
import {
  aiConfigured,
  askAdvisor,
  getAdvisorContext,
  hostedConfigured,
  streamAdvisor,
  suggestedQuestions,
  type AdvisorContext,
  type AiMode,
} from '../../services/aiAdvisor.ts';
import { loadSettings, saveSettings } from '../../services/settings.ts';
import { isPaid, readEntitlements } from '../../services/entitlements.ts';

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  context: AdvisorContext;
  onRequireUpgrade?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  source?: 'ai' | 'local';
  note?: string;
  streaming?: boolean;
}

const MODE_KEY = 'vector_ai_mode_v1';

function readMode(): AiMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'hosted' ? 'hosted' : 'byo';
  } catch {
    return 'byo';
  }
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-2" />;
        if (line.startsWith('•')) {
          return (
            <div key={index} className="flex gap-2 py-0.5">
              <span className="mt-[7px] w-1 h-1 rounded-full bg-[var(--v-violet)] shrink-0" />
              <span className="text-[12.5px] leading-relaxed text-[var(--v-ink)]">{line.replace(/^•\s*/, '')}</span>
            </div>
          );
        }
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <p key={index} className="text-[12.5px] leading-relaxed text-[var(--v-ink)] py-0.5">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold">
                  {part}
                </strong>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </>
  );
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ open, onClose, context, onRequireUpgrade }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<AiMode>(() => readMode());
  const [modelReady, setModelReady] = useState(() => aiConfigured());
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyForm, setKeyForm] = useState(() => {
    const settings = loadSettings();
    return { baseUrl: settings.baseUrl, model: settings.model, apiKey: settings.apiKey };
  });
  const listRef = useRef<HTMLDivElement>(null);

  const paid = isPaid(readEntitlements());
  const live = getAdvisorContext();
  const chips = suggestedQuestions(live);
  const hosted = hostedConfigured();
  const modelLive = mode === 'hosted' ? paid && hosted : modelReady;

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, busy]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const appendTo = (id: string, chunk: string) => {
    setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, text: message.text + chunk } : message)));
  };

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setBusy(true);

    const ctx = getAdvisorContext();

    try {
      if (modelLive) {
        const id = `a-${Date.now()}`;
        setMessages((prev) => [...prev, { id, role: 'assistant', text: '', source: 'ai', streaming: true }]);
        let streamed = false;
        try {
          streamed = await streamAdvisor(text, ctx, (chunk) => appendTo(id, chunk), mode);
        } catch {
          streamed = false;
        }
        if (streamed) {
          setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, streaming: false } : message)));
        } else {
          const fallback = await askAdvisor(text, ctx, mode);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === id
                ? { ...message, text: fallback.answer, source: fallback.source, streaming: false, note: 'Streaming unavailable — answered once.' }
                : message
            )
          );
        }
      } else {
        const result = await askAdvisor(text, ctx, mode);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: result.answer,
            source: result.source,
            note:
              mode === 'hosted' && !paid
                ? "Vector's model is part of Pro — this answer came from the local reviewer."
                : mode === 'byo' && !modelReady
                  ? 'Add your API key to chat with a model.'
                  : result.note,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'assistant', text: 'Something went wrong. Try a different question.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const saveModel = () => {
    saveSettings({
      ...loadSettings(),
      baseUrl: keyForm.baseUrl.trim() || 'https://api.groq.com/openai/v1',
      model: keyForm.model.trim() || 'openai/gpt-oss-120b',
      apiKey: keyForm.apiKey.trim(),
    });
    setModelReady(aiConfigured());
    setShowKeyForm(false);
    setMode('byo');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[90] flex">
      <aside className="v-slide-in w-full sm:w-[420px] h-full bg-[var(--v-surface)] border-l border-[var(--v-line)] shadow-[var(--v-shadow-lg)] flex flex-col">
        <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-[var(--v-line)]">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--v-faint)]">Vector AI</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider ${
                  modelLive ? 'bg-[var(--v-surface-2)] text-[var(--v-violet)]' : 'bg-[var(--v-surface-2)] text-[var(--v-faint)]'
                }`}
              >
                {modelLive ? 'Live' : 'Local'}
              </span>
            </div>
            <p className="truncate text-[9.5px] text-[var(--v-faint)]">
              {live.pageName || live.title}
              {live.frame ? ` · ${live.frame.width}×${live.frame.height}` : ''}
              {live.elements ? ` · ${live.elements.length} elements` : ''}
              {live.selected ? ` · ${live.selected.name} selected` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="v-icon-btn w-8 h-8" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Model source */}
        <div className="mx-3 mt-3 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--v-faint)]">Model</span>
            <div className="ml-auto flex rounded-full bg-[var(--v-surface)] p-0.5">
              <button
                type="button"
                onClick={() => setMode('byo')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                  mode === 'byo' ? 'bg-[var(--v-ink)] text-[var(--v-surface)]' : 'text-[var(--v-muted)]'
                }`}
              >
                Your key
              </button>
              <button
                type="button"
                onClick={() => setMode('hosted')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                  mode === 'hosted' ? 'bg-[var(--v-ink)] text-[var(--v-surface)]' : 'text-[var(--v-muted)]'
                }`}
              >
                <Crown className="w-2.5 h-2.5" /> Vector's
              </button>
            </div>
          </div>

          {mode === 'byo' && (
            <div className="mt-2">
              {modelReady ? (
                <p className="flex items-center gap-1.5 text-[10.5px] text-[var(--v-muted)]">
                  <Check className="w-3 h-3 text-[var(--v-teal)]" /> Connected to {loadSettings().model}
                  <button type="button" onClick={() => setShowKeyForm(true)} className="ml-auto font-semibold text-[var(--v-violet)] hover:underline">
                    Change
                  </button>
                </p>
              ) : showKeyForm ? (
                <div className="space-y-1.5">
                  <input
                    value={keyForm.baseUrl}
                    onChange={(event) => setKeyForm((prev) => ({ ...prev, baseUrl: event.target.value }))}
                    placeholder="https://api.groq.com/openai/v1"
                    className="v-input h-8 px-2.5 text-[11px]"
                  />
                  <input
                    value={keyForm.model}
                    onChange={(event) => setKeyForm((prev) => ({ ...prev, model: event.target.value }))}
                    placeholder="openai/gpt-oss-120b"
                    className="v-input h-8 px-2.5 text-[11px]"
                  />
                  <input
                    value={keyForm.apiKey}
                    onChange={(event) => setKeyForm((prev) => ({ ...prev, apiKey: event.target.value }))}
                    placeholder="API key"
                    type="password"
                    className="v-input h-8 px-2.5 text-[11px]"
                  />
                  <div className="flex gap-1.5">
                    <button type="button" onClick={saveModel} className="h-8 flex-1 rounded-lg bg-[var(--v-ink)] text-[11px] font-semibold text-[var(--v-surface)]">
                      Save and connect
                    </button>
                    <button type="button" onClick={() => setShowKeyForm(false)} className="h-8 px-3 rounded-lg border border-[var(--v-line)] text-[11px] font-semibold text-[var(--v-muted)]">
                      Later
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[10.5px] leading-relaxed text-[var(--v-muted)]">
                    Any OpenAI-compatible endpoint — Groq, OpenRouter, Ollama. Free on every plan; the key stays in this browser.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowKeyForm(true)}
                    className="mt-1.5 inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--v-line)] px-2.5 text-[10.5px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface)]"
                  >
                    <KeyRound className="w-3 h-3" /> Add your API key
                  </button>
                </>
              )}
            </div>
          )}

          {mode === 'hosted' && (
            <div className="mt-2">
              {!paid ? (
                <>
                  <p className="text-[10.5px] leading-relaxed text-[var(--v-muted)]">
                    Vector's model is included with Pro — no key to manage. Or keep using your own key for free.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onRequireUpgrade?.();
                      onClose();
                    }}
                    className="mt-1.5 h-8 w-full rounded-lg text-[11px] font-semibold text-white"
                    style={{ backgroundColor: 'var(--v-accent)' }}
                  >
                    Upgrade to Pro
                  </button>
                </>
              ) : hosted ? (
                <p className="flex items-center gap-1.5 text-[10.5px] text-[var(--v-muted)]">
                  <Check className="w-3 h-3 text-[var(--v-teal)]" /> Connected to Vector's hosted model
                </p>
              ) : (
                <>
                  <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-[var(--v-muted)]">
                    <Server className="mt-0.5 w-3 h-3 shrink-0" />
                    The hosted model is being provisioned for your workspace. Until then, add your own key — it works on every plan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('byo')}
                    className="mt-1.5 inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--v-line)] px-2.5 text-[10.5px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface)]"
                  >
                    <KeyRound className="w-3 h-3" /> Use my key instead
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto v-scroll px-5 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center text-center">
              <span className="w-11 h-11 rounded-lg v-grad text-white grid place-items-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="v-display text-[26px] leading-tight mt-4 text-[var(--v-ink)]">
                Get <span className="v-gradient-text">help</span>
                <br />
                with this page
              </h2>
              <p className="mt-2 text-[12px] text-[var(--v-muted)]">
                {modelLive ? 'Live model chat, grounded in your canvas.' : 'Fast answers from the local reviewer.'}
              </p>

              <div className="mt-5 space-y-1.5 text-left">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void send(chip)}
                    className="w-full rounded-xl border border-[var(--v-line)] px-3 py-2.5 text-left text-[11.5px] font-semibold text-[var(--v-ink)] transition-colors hover:border-[var(--v-violet)] hover:bg-[var(--v-surface-2)]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) =>
                message.role === 'user' ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg rounded-br-md bg-[var(--v-ink)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--v-surface)]">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg v-grad text-white">
                      <Sparkles className="w-3 h-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-lg rounded-tl-md bg-[var(--v-surface-2)] px-3.5 py-2.5">
                        {message.text ? <Rich text={message.text} /> : <span className="text-[12px] text-[var(--v-faint)]">Thinking…</span>}
                        {message.streaming && (
                          <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-[var(--v-violet)] align-middle" />
                        )}
                      </div>
                      {message.note && <p className="mt-1 text-[10px] text-[var(--v-coral)]">{message.note}</p>}
                      <p className="mt-1 flex items-center gap-1 text-[9.5px] text-[var(--v-faint)]">
                        {message.source === 'ai' ? (
                          <>
                            <Check className="h-2.5 w-2.5 text-[var(--v-teal)]" />
                            {mode === 'hosted' ? "Vector's model" : 'Your model'} · grounded in this page
                          </>
                        ) : (
                          'Local reviewer · no model configured'
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--v-line)] p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-2 transition-colors focus-within:border-[var(--v-violet)]"
          >
            <div className="flex items-center gap-1.5">
              <button type="button" className="v-icon-btn h-7 w-7" aria-label="Add context">
                <Plus className="w-4 h-4" />
              </button>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="How can I help?"
                className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--v-ink)] outline-none placeholder:text-[var(--v-faint)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                className="grid h-7 w-7 place-items-center rounded-full v-grad text-white disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[9px] text-[var(--v-faint)]">
                {modelLive ? 'Live model · replies stream in' : 'Local reviewer · add a key or upgrade for live chat'}
              </span>
              <button type="button" className="v-icon-btn h-6 w-6" aria-label="Voice input">
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          <p className="mt-1.5 text-center text-[9.5px] text-[var(--v-faint)]">
            AI can make mistakes. Double-check for accuracy.
          </p>
        </div>
      </aside>
    </div>
  );
};
