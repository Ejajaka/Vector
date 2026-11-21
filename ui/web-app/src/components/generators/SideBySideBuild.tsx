import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy, RefreshCw, Sparkles, X } from 'lucide-react';

interface SideBySideBuildProps {
  open: boolean;
  prompt: string;
  onClose: () => void;
}

const TOOLS = [
  { id: 'base44', name: 'Base44', url: 'https://app.base44.com', hint: 'Embedded builder with a hosted database' },
  { id: 'v0', name: 'v0', url: 'https://v0.app', hint: 'React + Tailwind components' },
  { id: 'bolt', name: 'Bolt', url: 'https://bolt.new', hint: 'Full-stack apps in the browser' },
  { id: 'lovable', name: 'Lovable', url: 'https://lovable.dev', hint: 'Prompt to deployed app' },
] as const;

/** The prompt and an external builder in one split workspace. */
export const SideBySideBuild: React.FC<SideBySideBuildProps> = ({ open, prompt, onClose }) => {
  const [toolId, setToolId] = useState<(typeof TOOLS)[number]['id']>('base44');
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const tool = TOOLS.find((entry) => entry.id === toolId) || TOOLS[0];

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be blocked; the prompt is still selectable.
    }
  };

  return (
    <div className="fixed inset-0 z-[97] flex flex-col bg-[#14121A] text-white" role="dialog" aria-modal="true" aria-label="Generate side by side">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundImage: 'linear-gradient(135deg,#7C5CFF,#22D3EE)' }}>
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold">Generate side by side</p>
          <p className="text-[9.5px] text-white/40">Your prompt on the left, the builder on the right.</p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          {TOOLS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setToolId(entry.id);
                setReloadKey((value) => value + 1);
              }}
              className={`h-7 rounded-md px-2 text-[10px] font-semibold ${
                toolId === entry.id ? 'bg-[#e8e8ea] text-[#08090a]' : 'text-white/55 hover:bg-white/10 hover:text-white'
              }`}
              title={entry.hint}
            >
              {entry.name}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-white/60 hover:bg-white/10" aria-label="Close side-by-side builder">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,38%)_1fr]">
        <section className="flex min-h-0 flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Final prompt</p>
            <button
              type="button"
              onClick={copy}
              className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-white/15 px-2 text-[10px] font-semibold text-white/75 hover:bg-white/10"
            >
              {copied ? <Check className="h-3 w-3 text-[#6ea8fe]" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy prompt'}
            </button>
          </div>
          <textarea
            readOnly
            value={prompt}
            className="v-scroll min-h-[160px] flex-1 resize-none bg-[#1B1A22] p-3 font-mono text-[10.5px] leading-relaxed text-white/75 outline-none"
            aria-label="Prompt to paste"
          />
          <div className="shrink-0 border-t border-white/10 p-3">
            <p className="text-[9.5px] leading-relaxed text-white/35">
              Paste this into {tool.name}. It includes the layout, copy, interactions and design tokens from your project.
            </p>
          </div>
        </section>

        <section className="flex min-h-[320px] flex-col bg-[#242424]">
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-[10px] text-white/40">{tool.url}</span>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="grid h-7 w-7 place-items-center rounded-md text-white/50 hover:bg-white/10"
              title="Reload"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <a
              href={tool.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-md bg-[#e8e8ea] px-2.5 text-[10px] font-semibold text-[#08090a]"
            >
              Open in new tab <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="relative flex-1">
            <iframe
              key={`${tool.id}-${reloadKey}`}
              src={tool.url}
              title={`${tool.name} builder`}
              className="h-full min-h-[420px] w-full border-0 bg-white"
              allow="clipboard-read; clipboard-write"
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg border border-white/10 bg-[#17171A]/90 px-3 py-2 text-[9.5px] text-white/50">
              Some builders block embedding. If the frame stays blank, use <span className="font-semibold text-white/75">Open in new tab</span>.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
