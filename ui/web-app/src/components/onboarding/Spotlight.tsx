import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export type SpotlightArt = 'drag' | 'style' | 'pages' | 'template' | 'prompt';

interface SpotlightProps {
  title: string;
  body: string;
  art: SpotlightArt;
  anchor?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  learnLabel?: string;
  onLearnMore?: () => void;
  onDismiss: () => void;
}

const ART: Record<SpotlightArt, React.ReactNode> = {
  drag: (
    <div className="relative w-full h-full grid place-items-center" style={{ background: 'linear-gradient(140deg,#241F3A,#1A1D26)' }}>
      <div className="flex items-end gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-14 h-16 rounded-md border border-white/15 bg-white/8 p-1.5"
            style={{ transform: `rotate(${(i - 1) * 4}deg) translateY(${i === 1 ? -6 : 0}px)` }}
          >
            <div className="h-1 w-6 rounded-full" style={{ background: i === 1 ? '#7C5CFF' : 'rgba(255,255,255,.35)' }} />
            <div className="mt-1 h-1 w-8 rounded-full bg-white/20" />
            <div className="mt-1 h-6 rounded bg-white/12" />
          </div>
        ))}
      </div>
      <span className="absolute right-10 bottom-5 w-3 h-3 rounded-sm bg-white shadow" />
    </div>
  ),
  style: (
    <div className="relative w-full h-full p-4" style={{ background: 'linear-gradient(140deg,#1B2A38,#1A1D26)' }}>
      <div className="flex gap-2">
        {['#FFFFFF', '#7C5CFF', '#22D3EE', '#FF7A59'].map((c) => (
          <span key={c} className="w-6 h-6 rounded-full border-2 border-white/20" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-4 h-[3px] w-full rounded-full bg-white/15">
        <div className="h-full w-1/3 rounded-full bg-[#0D99FF]" />
        <span className="relative -top-[7px] left-1/3 block w-3 h-3 rounded-full bg-white" />
      </div>
      <div className="mt-5 h-10 rounded-md border-2 border-[#0D99FF] bg-white/5" />
    </div>
  ),
  pages: (
    <div className="relative w-full h-full grid place-items-center gap-2" style={{ background: 'linear-gradient(140deg,#202B26,#1A1D26)' }}>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`w-9 h-11 rounded-md border grid place-items-center text-[10px] font-bold ${
              n === 2 ? 'bg-[#0D99FF] border-[#0D99FF] text-white' : 'border-white/20 text-white/45'
            }`}
          >
            {n}
          </span>
        ))}
        <span className="w-7 h-7 rounded-md border border-dashed border-white/25 grid place-items-center text-white/40 text-[12px]">
          +
        </span>
      </div>
    </div>
  ),
  template: (
    <div className="w-full h-full p-3" style={{ background: 'linear-gradient(140deg,#2A2438,#1A1D26)' }}>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 rounded bg-white/10 border border-white/10 p-1">
            <div className="h-1 w-4 rounded-full bg-white/40" />
            <div className="mt-1 h-4 rounded bg-white/15" />
          </div>
        ))}
      </div>
    </div>
  ),
  prompt: (
    <div className="relative w-full h-full p-3 font-mono text-[7px] leading-[1.5] text-white/45" style={{ background: 'linear-gradient(140deg,#1A2430,#12151C)' }}>
      <span className="absolute right-2 top-2 rounded bg-white/10 px-1 py-0.5 text-[6px] uppercase tracking-wider text-white/50">
        Example
      </span>
      <p className="text-[#B9A8FF]">PAGE 1 — “Home”</p>
      <p className="mt-1">1. Primary filled button, violet, 176×48</p>
      <p>2. Card, white surface, 12px radius</p>
      <p>3. Chart, bar, last 9 months</p>
      <p className="mt-1 text-[#22D3EE]">Synced · 13 elements</p>
    </div>
  ),
};

export const Spotlight: React.FC<SpotlightProps> = ({
  title,
  body,
  art,
  anchor,
  placement = 'top',
  learnLabel = 'Learn more',
  onLearnMore,
  onDismiss,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; arrow: number; side: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    arrow: 50,
    side: 'top',
  });

  useEffect(() => {
    const measure = () => {
      const width = 320;
      const margin = 12;
      const node = anchor ? document.querySelector(anchor) : null;
      if (!node) {
        setPosition({
          top: window.innerHeight - 260,
          left: Math.max(16, window.innerWidth / 2 - width / 2),
          arrow: 50,
          side: 'bottom',
        });
        return;
      }
      const rect = node.getBoundingClientRect();
      const cardHeight = ref.current?.offsetHeight || 250;

      const spaceBelow = window.innerHeight - rect.bottom;
      const side: 'top' | 'bottom' = spaceBelow > cardHeight + 24 ? 'bottom' : 'top';
      const top = side === 'bottom' ? rect.bottom + 14 : Math.max(12, rect.top - cardHeight - 14);
      const center = rect.left + rect.width / 2;
      const left = Math.min(Math.max(12, center - width / 2), window.innerWidth - width - 12);
      const arrow = Math.min(Math.max(24, center - left), width - 24);

      setPosition({ top, left, arrow, side });
    };

    measure();
    const timer = window.setTimeout(measure, 60);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchor]);

  return (
    <div className="fixed inset-0 z-[92] pointer-events-none" role="dialog" aria-modal="false" aria-labelledby="spotlight-title">
      <div
        ref={ref}
        className="pointer-events-auto absolute w-[320px] rounded-xl overflow-visible bg-[#2C2C2C] border border-white/12 shadow-[0_30px_70px_-20px_rgba(0,0,0,.85)]"
        style={{ top: position.top, left: position.left }}
      >
        {/* Arrow */}
        <span
          className="absolute w-3 h-3 bg-[#2C2C2C] border-white/12 rotate-45"
          style={{
            left: position.arrow - 6,
            top: position.side === 'bottom' ? -7 : undefined,
            bottom: position.side === 'top' ? -7 : undefined,
            borderTopWidth: position.side === 'bottom' ? 1 : 0,
            borderLeftWidth: position.side === 'bottom' ? 1 : 0,
            borderRightWidth: position.side === 'top' ? 1 : 0,
            borderBottomWidth: position.side === 'top' ? 1 : 0,
            borderStyle: 'solid',
            borderColor: 'rgba(255,255,255,.12)',
          }}
          aria-hidden="true"
        />

        <div className="flex items-center justify-between px-4 pt-3">
          <p id="spotlight-title" className="text-[12.5px] font-semibold text-white">
            {title}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="w-6 h-6 rounded grid place-items-center text-white/50 hover:text-white hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mx-4 mt-2.5 h-[136px] rounded-lg overflow-hidden border border-white/10">{ART[art]}</div>

        <p className="px-4 pt-3 pb-3 text-[12px] leading-relaxed text-white/70">{body}</p>

        <div className="flex items-center justify-end gap-2 px-4 pb-3.5">
          {onLearnMore && (
            <button
              type="button"
              onClick={onLearnMore}
              className="h-8 px-3 rounded-md border border-white/20 text-[11.5px] font-semibold text-white/85 hover:bg-white/5"
            >
              {learnLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="h-8 px-3.5 rounded-md text-[11.5px] font-semibold text-white"
            style={{ background: '#0D99FF' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
