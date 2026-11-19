import React, { useState } from 'react';
import { Check, Copy, Mail, MapPin, MessageSquare } from 'lucide-react';
import type { ActiveTab } from '../types/analysis.ts';

interface ContactPageProps {
  onNavigate: (tab: ActiveTab) => void;
}

const EMAIL = 'hello@vector.is-a.dev';

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: 'Sales', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const body = encodeURIComponent(`From: ${form.name} <${form.email}>\nTopic: ${form.topic}\n\n${form.message}`);
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`[${form.topic}] Vector enquiry`)}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="v-eyebrow">Contact</p>
          <h1 className="v-display mt-2 text-[32px] text-[var(--v-ink)] sm:text-[40px]">Talk to a human</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--v-muted)]">
            Questions about plans, a workspace setup, or importing your organisation&apos;s design system? We answer
            within one working day.
          </p>

          <div className="mt-6 space-y-2.5">
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5">
              <Mail className="h-4 w-4 text-[var(--v-violet)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[var(--v-ink)]">Email</p>
                <p className="truncate font-mono text-[10.5px] text-[var(--v-muted)]">{EMAIL}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(EMAIL);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  } catch {
                    // ignore
                  }
                }}
                className="grid h-7 w-7 place-items-center rounded-md border border-[var(--v-line)] text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                aria-label="Copy email"
              >
                {copied ? <Check className="h-3 w-3 text-[var(--v-teal)]" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5">
              <MapPin className="h-4 w-4 text-[var(--v-violet)]" />
              <div>
                <p className="text-[11px] font-bold text-[var(--v-ink)]">Studio</p>
                <p className="text-[10.5px] text-[var(--v-muted)]">Bengaluru, India · remote-first</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5">
              <MessageSquare className="h-4 w-4 text-[var(--v-violet)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[var(--v-ink)]">In-app help</p>
                <p className="text-[10.5px] text-[var(--v-muted)]">Ask Vector AI from any canvas</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('learn')}
                className="text-[10.5px] font-bold text-[var(--v-violet)] hover:underline"
              >
                Learn
              </button>
            </div>
          </div>

          <p className="mt-4 text-[10.5px] text-[var(--v-faint)]">
            By writing to us you agree to our{' '}
            <button type="button" onClick={() => onNavigate('privacy')} className="underline hover:text-[var(--v-ink)]">
              privacy policy
            </button>{' '}
            and{' '}
            <button type="button" onClick={() => onNavigate('terms')} className="underline hover:text-[var(--v-ink)]">
              terms
            </button>
            .
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-5">
          <h2 className="text-[14px] font-bold text-[var(--v-ink)]">Send a message</h2>
          <p className="mt-0.5 text-[11px] text-[var(--v-muted)]">Opens your mail client with everything filled in.</p>

          <div className="mt-4 space-y-2.5">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                className="v-input mt-1 h-9 px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
                className="v-input mt-1 h-9 px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Topic</span>
              <select
                value={form.topic}
                onChange={(event) => setForm({ ...form, topic: event.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[12px] text-[var(--v-ink)] outline-none"
              >
                <option>Sales</option>
                <option>Workspace setup</option>
                <option>Design system import</option>
                <option>Billing</option>
                <option>Bug report</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Message</span>
              <textarea
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                rows={5}
                required
                className="mt-1 w-full resize-none rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2 text-[12px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
              />
            </label>
          </div>

          <button type="submit" className="mt-4 w-full v-btn v-btn-primary h-10 text-[12px]">
            <Mail className="h-3.5 w-3.5" /> Open mail client
          </button>
          {sent && <p className="mt-2 text-center text-[10px] text-[var(--v-teal)]">Draft created — send it from your mail app.</p>}
        </form>
      </div>
    </div>
  );
};
