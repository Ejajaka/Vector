import React from 'react';
import type { DesignTokens } from '../../types/designSystem.ts';

function channels(hex: string): { r: number; g: number; b: number } {
  const value = (hex || '').replace('#', '');
  const full = value.length === 3 ? value.split('').map((part) => part + part).join('') : value;
  const parsed = Number.parseInt(full, 16);
  if (Number.isNaN(parsed) || full.length !== 6) return { r: 255, g: 255, b: 255 };
  return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 };
}

export function isDarkColor(hex: string): boolean {
  const { r, g, b } = channels(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.55;
}

/**
 * A tiny, abstract website mock rendered with the theme tokens. It is a visual
 * preview of the palette and shape language rather than a real brand page.
 */
export const ThemePreview: React.FC<{ tokens: DesignTokens; className?: string }> = ({ tokens, className = '' }) => {  const surface = tokens.secondaryColor || '#FFFFFF';
  const dark = isDarkColor(surface);
  const ink = dark ? '#FFFFFF' : '#1D1D1F';
  const muted = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
  const faint = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.13)';
  const line = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.09)';
  const panel = dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF';
  const primary = tokens.primaryColor || '#49686C';
  const accent = tokens.accentColor || '#D1B653';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: surface }} aria-hidden="true">
      <div
        className="absolute -right-7 -top-9 h-24 w-24 rounded-full blur-2xl"
        style={{ background: accent, opacity: dark ? 0.38 : 0.24 }}
      />
      <div className="relative p-2.5">
        <div className="flex items-center gap-1">
          {[0.28, 0.2, 0.14].map((opacity, index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: dark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})` }}
            />
          ))}
          <span
            className="ml-1 h-3 flex-1 rounded-full"
            style={{ background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          />
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: primary }} />
          <span className="h-1.5 w-10 rounded-full" style={{ background: faint }} />
          <span className="h-1.5 w-6 rounded-full" style={{ background: faint }} />
          <span className="ml-auto h-4 w-10 rounded-full" style={{ background: primary }} />
        </div>

        <div className="mt-3 flex gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="h-2 w-[88%] rounded-full" style={{ background: ink, opacity: 0.92 }} />
            <div className="mt-1.5 h-2 w-[64%] rounded-full" style={{ background: ink, opacity: 0.5 }} />
            <div className="mt-2 h-1.5 w-[82%] rounded-full" style={{ background: muted, opacity: 0.7 }} />
            <div className="mt-1 h-1.5 w-[68%] rounded-full" style={{ background: muted, opacity: 0.5 }} />
            <div className="mt-2.5 flex gap-1.5">
              <span className="h-4 w-12 rounded-md" style={{ background: primary }} />
              <span className="h-4 w-9 rounded-md border" style={{ borderColor: line }} />
            </div>
          </div>
          <div className="w-[37%] space-y-1.5">
            <div className="rounded-md border p-1.5" style={{ borderColor: line, background: panel }}>
              <div className="h-1.5 w-6 rounded-full" style={{ background: accent }} />
              <div className="mt-1 h-1 w-full rounded-full" style={{ background: faint }} />
              <div className="mt-1 h-1 w-2/3 rounded-full" style={{ background: faint }} />
            </div>
            <div className="rounded-md border p-1.5" style={{ borderColor: line, background: panel }}>
              <div className="h-1 w-3/4 rounded-full" style={{ background: faint }} />
              <div className="mt-1 h-1 w-1/2 rounded-full" style={{ background: faint }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** A scaled-down version of the theme preview for compact lists. */
export const ThemeThumb: React.FC<{ tokens: DesignTokens; className?: string }> = ({ tokens, className = '' }) => (
  <div
    className={`relative shrink-0 overflow-hidden rounded-md border border-[#E5E2D8] bg-white ${className}`}
    aria-hidden="true"
  >
    <div className="absolute left-0 top-0 w-[248px] origin-top-left scale-[0.24]">
      <ThemePreview tokens={tokens} />
    </div>
  </div>
);
