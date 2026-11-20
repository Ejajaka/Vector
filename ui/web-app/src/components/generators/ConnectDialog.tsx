import React, { useState } from 'react';
import { ArrowUpRight, Check, Copy, Crown, Lock, X } from 'lucide-react';

interface ConnectDialogProps {
  open: boolean;
  onClose: () => void;
  prompt: string;
  paid: boolean;
  onRequireUpgrade: () => void;
}

interface Generator {
  id: string;
  name: string;
  url: string;
  blurb: string;
  tier: 'free' | 'pro';
  from: string;
  to: string;
}

const GENERATORS: Generator[] = [
  {
    id: 'base44',
    name: 'Base44',
    url: 'https://app.base44.com',
    blurb: 'Embedded builder. Paste the brief and get a working app.',
    tier: 'free',
    from: '#4D7CFE',
    to: '#22D3EE',
  },
  {
    id: 'v0',
    name: 'v0 by Vercel',
    url: 'https://v0.app',
    blurb: 'Best for React + Tailwind component output.',
    tier: 'free',
    from: '#0B0E14',
    to: '#4D7CFE',
  },
  {
    id: 'bolt',
    name: 'Bolt',
    url: 'https://bolt.new',
    blurb: 'Full-stack in the browser, broad framework support.',
    tier: 'pro',
    from: '#FFC53D',
    to: '#FF7A59',
  },
  {
    id: 'lovable',
    name: 'Lovable',
    url: 'https://lovable.dev',
    blurb: 'Prompt to deployed app with a hosted database.',
    tier: 'pro',
    from: '#FF5C8A',
    to: '#7C5CFF',
  },
  {
    id: 'figma',
    name: 'Figma',
    url: 'https://figma.com',
    blurb: 'Import a frame instead of a prompt — needs a paid plan.',
    tier: 'pro',
    from: '#22D3EE',
    to: '#4D7CFE',
  },
];

export const ConnectDialog: React.FC<ConnectDialogProps> = ({ open, onClose, prompt, paid, onRequireUpgrade }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!open) return null;

  const use = async (generator: Generator) => {
    if (generator.tier === 'pro' && !paid) {
      onRequireUpgrade();
      onClose();
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(generator.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard may be blocked; still open the tool.
    }
    window.open(generator.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-[560px] overflow-hidden rounded-xl border border-white/10 bg-[#2C2C2C] text-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)]">
        <div className="flex items-start justify-between px-4 pt-4">
          <div>
            <h2 className="text-[14px] font-semibold">Generate this project</h2>
            <p className="mt-0.5 text-[11px] text-white/45">
              Copy the revised prompt, then pick the tool you want to build in.
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-white/50 hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[62vh] space-y-1.5 overflow-y-auto v-scroll px-4 py-3">
          {GENERATORS.map((generator) => {
            const locked = generator.tier === 'pro' && !paid;
            return (
              <button
                key={generator.id}
                type="button"
                onClick={() => void use(generator)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-[#333] p-2.5 text-left transition-colors hover:border-white/25"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-white"
                  style={{ backgroundImage: `linear-gradient(140deg, ${generator.from}, ${generator.to})` }}
                >
                  {generator.name.slice(0, 2).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-white">{generator.name}</span>
                    {generator.tier === 'pro' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFC53D]/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#FFC53D]">
                        <Crown className="h-2 w-2" /> Pro
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-white/45">{generator.blurb}</span>
                </span>

                <span className="shrink-0 text-white/50">
                  {locked ? (
                    <Lock className="h-3.5 w-3.5 text-[#FFC53D]" />
                  ) : copiedId === generator.id ? (
                    <Check className="h-3.5 w-3.5 text-[#28C76F]" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <p className="text-[9.5px] leading-relaxed text-white/35">
            Free plan: Base44 and v0. Pro unlocks Bolt, Lovable and Figma import.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(prompt);
                setCopiedId('prompt');
                window.setTimeout(() => setCopiedId(null), 1600);
              } catch {
                // ignore
              }
            }}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/15 px-2.5 text-[10.5px] font-semibold text-white/85 hover:bg-white/5"
          >
            {copiedId === 'prompt' ? <Check className="h-3 w-3 text-[#28C76F]" /> : <Copy className="h-3 w-3" />} Copy prompt
          </button>
        </div>
      </div>
    </div>
  );
};
