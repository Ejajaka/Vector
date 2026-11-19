import React from 'react';
import { Image as ImageIcon, Table2 } from 'lucide-react';
import type { StyleVariant } from '../../data/styles.ts';
import { StyledElement } from './StyledElement.tsx';

/**
 * Thumbnail for a single styled variant.
 *
 * A 900px table scaled to fit a 70px box becomes an unreadable sliver — which
 * is why the old tiles looked blank. Instead each family gets a purpose-built
 * miniature, and only compact elements are scaled for real.
 */
export const VariantPreview: React.FC<{ variant: StyleVariant }> = ({ variant }) => {
  const accent = variant.color || '#7C5CFF';

  if (variant.group === 'Text') {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1 px-2.5">
        <span
          className="leading-none"
          style={{
            fontSize: variant.id === 'text-display' ? 22 : variant.id === 'text-h2' ? 18 : 14,
            fontWeight: variant.id === 'text-display' ? 800 : variant.id === 'text-body' ? 400 : 600,
            color: '#0B0E14',
          }}
        >
          Aa
        </span>
        <div className="h-1 w-4/5 rounded-full bg-[#E4E0EF]" />
        <div className="h-1 w-3/5 rounded-full bg-[#EFEDF6]" />
      </div>
    );
  }

  if (variant.group === 'Images') {
    return (
      <div
        className="grid h-full w-full place-items-center"
        style={{ background: `linear-gradient(140deg, ${accent}55, ${accent}18)` }}
      >
        <ImageIcon className="h-5 w-5" style={{ color: accent }} />
      </div>
    );
  }

  if (variant.style === 'table-default') {
    return (
      <div className="flex h-full w-full flex-col gap-1 p-1.5">
        <div className="h-2.5 rounded-sm bg-[#F1EFF8]" />
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-full bg-[#E4E0EF]" />
            <span className="h-1.5 flex-1 rounded-full bg-[#F1EFF8]" />
            <span className="h-1.5 w-2 rounded-full" style={{ background: `${accent}55` }} />
          </div>
        ))}
        <Table2 className="hidden" />
      </div>
    );
  }

  if (variant.style === 'chart-bars') {
    return (
      <div className="flex h-full w-full items-end gap-1 p-2">
        {[42, 68, 50, 84, 60, 92].map((height, index) => (
          <div key={index} className="flex-1 rounded-t-sm" style={{ height: `${height}%`, background: index > 3 ? accent : `${accent}44` }} />
        ))}
      </div>
    );
  }

  if (variant.style === 'chart-line') {
    return (
      <svg viewBox="0 0 100 48" className="h-full w-full p-1.5" preserveAspectRatio="none">
        <defs>
          <linearGradient id="thumb-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={accent} stopOpacity=".4" />
            <stop offset="1" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,38 L16,30 L32,34 L48,18 L64,24 L80,10 L100,14 L100,48 L0,48 Z" fill="url(#thumb-line)" />
        <path d="M0,38 L16,30 L32,34 L48,18 L64,24 L80,10 L100,14" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant.style === 'chart-donut') {
    return (
      <div className="grid h-full w-full place-items-center">
        <div
          className="h-10 w-10 rounded-full"
          style={{ background: `conic-gradient(${accent} 0 55%, ${accent}77 55% 78%, #E4E0EF 78% 100%)` }}
        >
          <div className="m-auto mt-2.5 h-5 w-5 rounded-full bg-white" />
        </div>
      </div>
    );
  }

  if (variant.style === 'chart-progress') {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1.5 px-2.5">
        <div className="h-1.5 w-3/5 rounded-full bg-[#E4E0EF]" />
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEDF6]">
          <div className="h-full w-2/3 rounded-full" style={{ background: accent }} />
        </div>
      </div>
    );
  }

  if (variant.style === 'input-checkbox' || variant.style === 'input-toggle') {
    const on = variant.style === 'input-toggle';
    return (
      <div className="flex h-full w-full items-center gap-2 px-2.5">
        {on ? (
          <span className="h-4 w-7 rounded-full p-0.5" style={{ background: accent }}>
            <span className="ml-auto block h-3 w-3 rounded-full bg-white" />
          </span>
        ) : (
          <span className="grid h-4 w-4 place-items-center rounded-[3px]" style={{ background: accent }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M1.5 5.2 4 7.5 8.5 2.5" />
            </svg>
          </span>
        )}
        <span className="h-1.5 flex-1 rounded-full bg-[#E4E0EF]" />
      </div>
    );
  }

  if (variant.style === 'divider') {
    return (
      <div className="flex h-full w-full items-center gap-1.5 px-2.5">
        <span className="h-px flex-1 bg-[#E4E0EF]" />
        <span className="text-[7px] font-bold text-[#9B99A6]">OR</span>
        <span className="h-px flex-1 bg-[#E4E0EF]" />
      </div>
    );
  }

  if (variant.style === 'accordion') {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1 px-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className={`flex items-center gap-1 ${row === 0 ? 'rounded bg-[#F7F7FB] p-1' : ''}`}>
            <span className="h-1 flex-1 rounded-full bg-[#E4E0EF]" />
            <span className="text-[6px] text-[#9B99A6]">›</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant.style === 'badge-count') {
    return (
      <div className="grid h-full w-full place-items-center">
        <span className="grid h-5 w-5 place-items-center rounded-full text-[8px] font-bold text-white" style={{ background: accent }}>
          8
        </span>
      </div>
    );
  }

  // Compact elements render for real, fitted to the width.
  const scale = Math.min(132 / variant.w, variant.h < 120 ? 1 : 74 / variant.h);
  return (
    <div className="grid h-full w-full place-items-center overflow-hidden">
      <div style={{ width: variant.w, height: variant.h, transform: `scale(${scale})` }}>
        <StyledElement style={variant.style} label={variant.label} color={variant.color} />
      </div>
    </div>
  );
};
