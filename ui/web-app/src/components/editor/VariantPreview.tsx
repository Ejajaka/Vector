import React from 'react';
import { Table2 } from 'lucide-react';
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
      <div className="relative h-full w-full overflow-hidden">
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
          <rect width="100" height="60" fill="#E8F1FB" />
          <circle cx="76" cy="15" r="7" fill="#FFD166" />
          <path d="M0 46 L22 24 L40 42 L58 18 L82 44 L100 30 L100 60 L0 60 Z" fill="#B9D4F0" />
          <path d="M0 52 L18 40 L34 52 L52 34 L70 52 L88 42 L100 50 L100 60 L0 60 Z" fill="#7FA8D8" />
        </svg>
        <span className="absolute right-1 top-1 rounded bg-white/85 px-1 py-0.5 text-[6px] font-semibold uppercase tracking-wider text-[#4D7CFE]">
          Image
        </span>
      </div>
    );
  }

  if (variant.group === 'Cards') {
    const gradient = variant.style === 'card-gradient';
    const outline = variant.style === 'card-outline';
    const stat = variant.style === 'card-stat';
    const media = variant.style === 'card-media';
    const list = variant.style === 'card-list';

    const cardStyle: React.CSSProperties = gradient
      ? { backgroundImage: 'linear-gradient(135deg,#7C5CFF,#4D7CFE 55%,#22D3EE)' }
      : {
          background: '#FFFFFF',
          border: outline ? '1px solid #E3E0EC' : '1px solid #EFEDF6',
          boxShadow: outline ? 'none' : '0 3px 9px -3px rgba(11,14,20,.32)',
        };

    return (
      <div className="grid h-full w-full place-items-center p-1.5">
        <div
          className={`flex h-full w-full flex-col overflow-hidden rounded-md text-[#0B0E14] ${gradient ? 'text-white' : ''}`}
          style={cardStyle}
        >
          {media && (
            <div className="h-1/2 w-full overflow-hidden">
              <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
                <rect width="100" height="34" fill="#FCE9DF" />
                <circle cx="78" cy="9" r="4" fill="#FFC53D" />
                <path d="M0 30 L20 12 L36 26 L54 8 L76 28 L100 16 L100 34 L0 34 Z" fill="#F5B99B" />
              </svg>
            </div>
          )}

          {stat ? (
            <div className="flex flex-1 flex-col p-1.5">
              <span className="h-1 w-5 rounded-full bg-[#E4E0EF]" />
              <span className="mt-1 text-[11px] font-semibold leading-none">48k</span>
              <span className="mt-1 inline-flex w-fit rounded-full bg-[#DFF7F1] px-1 py-0.5 text-[6px] font-semibold text-[#0E8A9A]">
                ▲ 12%
              </span>
              <div className="mt-auto flex h-4 items-end gap-0.5">
                {[35, 55, 45, 75, 60, 90].map((height, index) => (
                  <span key={index} className="flex-1 rounded-t-sm" style={{ height: `${height}%`, background: index > 3 ? accent : `${accent}44` }} />
                ))}
              </div>
            </div>
          ) : list ? (
            <div className="flex flex-1 flex-col justify-center gap-1 p-1.5">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: `${accent}33` }} />
                  <span className="h-1 flex-1 rounded-full bg-[#EFEDF6]" />
                  <span className="h-1 w-3 rounded-full bg-[#E4E0EF]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-1.5">
              {!media && (
                <span className="mb-1 grid h-4 w-4 place-items-center rounded" style={{ background: gradient ? 'rgba(255,255,255,.25)' : `${accent}1F` }}>
                  <span className="h-1.5 w-1.5 rounded-sm" style={{ background: gradient ? '#FFFFFF' : accent }} />
                </span>
              )}
              <span className="h-1.5 w-4/5 rounded-full" style={{ background: gradient ? 'rgba(255,255,255,.9)' : '#D9D6E4' }} />
              <span className="mt-1 h-1 w-3/5 rounded-full" style={{ background: gradient ? 'rgba(255,255,255,.45)' : '#EFEDF6' }} />
              <span
                className="mt-auto inline-flex w-fit rounded px-1.5 py-0.5 text-[6px] font-semibold"
                style={gradient ? { background: '#FFFFFF', color: '#0B0E14' } : { background: accent, color: '#FFFFFF' }}
              >
                Open
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant.group === 'Buttons') {
    const style = variant.style;
    const buttonStyle: React.CSSProperties =
      style === 'btn-gradient'
        ? { backgroundImage: 'linear-gradient(118deg,#7C5CFF,#4D7CFE 55%,#22D3EE)', color: '#FFFFFF' }
        : style === 'btn-outline'
          ? { background: 'transparent', border: `1.5px solid ${accent}`, color: accent }
          : style === 'btn-pill'
            ? { background: `${accent}1F`, color: accent, borderRadius: 999 }
            : style === 'btn-ghost'
              ? { background: 'transparent', color: accent, textDecoration: 'underline' }
              : style === 'btn-dark'
                ? { background: '#0B0E14', color: '#FFFFFF' }
                : { background: accent, color: '#FFFFFF' };

    return (
      <div className="grid h-full w-full place-items-center p-2">
        <div
          className="grid h-6 w-[78%] place-items-center rounded-md text-[9px] font-semibold"
          style={{ ...buttonStyle, borderRadius: style === 'btn-pill' ? 999 : undefined }}
        >
          {variant.label || 'Button'}
        </div>
      </div>
    );
  }

  if (variant.group === 'Navigation') {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1.5 p-2">
        <div className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5F0] bg-white px-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: accent }} />
          <span className="h-1 w-5 rounded-full bg-[#D9D6E4]" />
          <span className="ml-auto flex items-center gap-1">
            <span className="h-0.5 w-2.5 rounded-full bg-[#D9D6E4]" />
            <span className="h-0.5 w-2.5 rounded-full bg-[#D9D6E4]" />
            <span className="h-0.5 w-2.5 rounded-full bg-[#D9D6E4]" />
          </span>
          <span className="h-3 w-5 rounded" style={{ background: '#0B0E14' }} />
        </div>
        <div className="h-4 rounded bg-[#F7F7FB]" />
      </div>
    );
  }

  if (variant.group === 'Inputs') {
    const search = variant.style === 'input-search';
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1 p-2">
        <span className="h-1 w-6 rounded-full bg-[#D9D6E4]" />
        <div className={`flex h-4 items-center gap-1 border border-[#E3E0EC] bg-white px-1.5 ${search ? 'rounded-full' : 'rounded-md'}`}>
          {search && <span className="text-[7px] leading-none text-[#9B99A6]">⌕</span>}
          <span className="h-1 w-8 rounded-full bg-[#EFEDF6]" />
        </div>
        <div className="h-3 rounded-md border border-[#EFEDF6] bg-[#FAFAFD]" />
      </div>
    );
  }

  if (variant.group === 'Badges') {
    return (
      <div className="flex h-full w-full flex-wrap content-center items-center justify-center gap-1 p-2">
        <span className="rounded-full px-1.5 py-0.5 text-[6px] font-semibold" style={{ background: `${accent}1F`, color: accent }}>
          NEW
        </span>
        <span className="rounded-full px-1.5 py-0.5 text-[6px] font-semibold text-white" style={{ background: accent }}>
          PRO
        </span>
        <span className="rounded-full border border-[#E7E5F0] px-1.5 py-0.5 text-[6px] font-semibold text-[#64626F]">
          • Live
        </span>
      </div>
    );
  }

  if (variant.style === 'modal-default') {
    return (
      <div className="grid h-full w-full place-items-center p-2" style={{ background: '#E9E7F1' }}>
        <div className="w-full rounded-md border border-[#E7E5F0] bg-white p-1.5 shadow-[0_4px_10px_-4px_rgba(11,14,20,.35)]">
          <span className="block h-1.5 w-2/3 rounded-full bg-[#D9D6E4]" />
          <span className="mt-1 block h-1 w-full rounded-full bg-[#EFEDF6]" />
          <span className="mt-0.5 block h-1 w-4/5 rounded-full bg-[#EFEDF6]" />
          <span className="mt-1.5 inline-flex rounded px-1.5 py-0.5 text-[6px] font-semibold text-white" style={{ background: accent }}>
            Confirm
          </span>
        </div>
      </div>
    );
  }

  if (variant.style === 'footer-default') {
    return (
      <div className="flex h-full w-full flex-col justify-end gap-1 p-2" style={{ background: '#0B0E14' }}>
        <div className="flex gap-2">
          <span className="h-1 w-6 rounded-full bg-white/70" />
          <span className="h-1 w-4 rounded-full bg-white/25" />
          <span className="h-1 w-4 rounded-full bg-white/25" />
        </div>
        <span className="h-1 w-1/2 rounded-full bg-white/15" />
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
        <span className="text-[7px] font-semibold text-[#9B99A6]">OR</span>
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
        <span className="grid h-5 w-5 place-items-center rounded-full text-[8px] font-semibold text-white" style={{ background: accent }}>
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
