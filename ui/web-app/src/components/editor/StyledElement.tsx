import React from 'react';
import { Check, ChevronDown, Search, Star } from 'lucide-react';
import type { StyleKey } from '../../data/styles.ts';
import { FONT_STACKS } from '../../data/canvas.ts';

interface StyledElementProps {
  style: StyleKey;
  label: string;
  texts?: Record<string, string>;
  color?: string;
  src?: string;
  fontSize?: number;
  fontWeight?: number;
  align?: 'left' | 'center' | 'right';
  fill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  radius?: number;
  fontFamily?: string;
  italic?: boolean;
  underline?: boolean;
  tracking?: number;
}

/**
 * One renderer for the canvas *and* the palette thumbnails. Every surface
 * honours fill / border / radius, and every text run honours family, size,
 * weight, italic, underline, tracking and alignment.
 */
export const StyledElement: React.FC<StyledElementProps> = ({
  style,
  label,
  texts,
  color,
  src,
  fontSize,
  fontWeight,
  align,
  fill,
  strokeColor,
  strokeWidth,
  radius,
  fontFamily,
  italic,
  underline,
  tracking,
}) => {
  const accent = color || '#7C5CFF';
  const copy = (key: string, fallback: string) => texts?.[key] ?? fallback;
  const copyList = (key: string, fallback: string) =>
    copy(key, fallback)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

  const border: React.CSSProperties =
    strokeWidth && strokeWidth > 0
      ? { borderStyle: 'solid', borderWidth: `${strokeWidth}px`, borderColor: strokeColor || '#E7E5F0' }
      : {};

  const box = (defaultBg: string, defaultRadius: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
    backgroundColor: fill ?? defaultBg,
    borderRadius: radius ?? defaultRadius,
    ...border,
    ...extra,
  });

  const type = (defaultSize: number): React.CSSProperties => ({
    fontSize: `${fontSize ?? defaultSize}px`,
    fontWeight,
    textAlign: align,
    fontFamily: fontFamily ? FONT_STACKS[fontFamily] : undefined,
    fontStyle: italic ? 'italic' : undefined,
    textDecoration: underline ? 'underline' : undefined,
    letterSpacing: tracking != null ? `${tracking}px` : undefined,
  });

  const text = (defaultSize: number, defaultColour = '#0B0E14'): React.CSSProperties => ({
    ...type(defaultSize),
    color: color || defaultColour,
  });

  /* ------------------------------------------------------------ images */
  if (src && style.startsWith('image-')) {
    const frame = style === 'image-framed';
    return (
      <div className={frame ? 'w-full h-full p-2 canvas-surface' : 'w-full h-full overflow-hidden'} style={frame ? box('#FFFFFF', 12) : box('#FFFFFF', 12)}>
        <img src={src} alt={label} className="w-full h-full object-cover rounded-lg" draggable={false} />
      </div>
    );
  }

  switch (style) {
    /* ---------------------------------------------------------- shapes */
    case 'rect':
      return <div className="w-full h-full" style={box('#F7F7FB', 12)} />;

    /* --------------------------------------------------------- buttons */
    case 'btn-solid':
      return (
        <div className="w-full h-full grid place-items-center font-semibold text-white" style={box(accent, 10, type(13))}>
          {label}
        </div>
      );
    case 'btn-gradient':
      return (
        <div
          className="w-full h-full grid place-items-center font-semibold text-white"
          style={box(accent, 10, {
            ...type(13),
            backgroundImage: fill ? 'none' : 'linear-gradient(118deg,#7C5CFF,#4D7CFE 55%,#22D3EE)',
            boxShadow: '0 8px 18px -8px rgba(124,92,255,.7)',
          })}
        >
          {label}
        </div>
      );
    case 'btn-outline':
      return (
        <div
          className="w-full h-full grid place-items-center font-semibold"
          style={box('transparent', 10, {
            ...type(13),
            borderStyle: 'solid',
            borderWidth: `${strokeWidth || 1.5}px`,
            borderColor: strokeColor || accent,
            color: accent,
          })}
        >
          {label}
        </div>
      );
    case 'btn-pill':
      return (
        <div
          className="w-full h-full rounded-full grid place-items-center font-semibold"
          style={box(`${accent}1F`, 999, { ...type(13), color: color && color !== accent ? color : accent })}
        >
          {label}
        </div>
      );
    case 'btn-ghost':
      return (
        <div
          className="w-full h-full grid place-items-center font-semibold underline decoration-2 underline-offset-4"
          style={box('transparent', 0, { ...type(13), color: accent })}
        >
          {label}
        </div>
      );
    case 'btn-dark':
      return (
        <div className="w-full h-full grid place-items-center font-semibold text-white" style={box('#0B0E14', 10, type(13))}>
          {label}
        </div>
      );

    /* ------------------------------------------------------------ cards */
    case 'card-elevated':
      return (
        <div
          className="w-full h-full p-4 flex flex-col"
          style={box('#FFFFFF', 12, { boxShadow: fill ? '0 10px 26px -16px rgba(11,14,20,.45)' : '0 10px 26px -16px rgba(11,14,20,.45)' })}
        >
          <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: `${accent}1F`, color: accent }}>
            <Star className="w-4 h-4" />
          </span>
          <span className="mt-2.5 text-[13px] font-semibold" style={text(13)}>{label}</span>
          <div className="mt-1.5 space-y-1">
            <div className="h-1.5 w-[82%] rounded-full bg-[#EFEDF6]" />
            <div className="h-1.5 w-[60%] rounded-full bg-[#EFEDF6]" />
          </div>
        </div>
      );
    case 'card-outline':
      return (
        <div
          className="w-full h-full p-4 flex flex-col"
          style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}
        >
          <span className="text-[13px] font-semibold" style={text(13)}>{label}</span>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-[88%] rounded-full bg-[#F1EFF8]" />
            <div className="h-1.5 w-[70%] rounded-full bg-[#F1EFF8]" />
            <div className="h-1.5 w-[48%] rounded-full bg-[#F1EFF8]" />
          </div>
        </div>
      );
    case 'card-gradient':
      return (
        <div
          className="w-full h-full p-4 flex flex-col text-white"
          style={box(accent, 12, { backgroundImage: fill ? 'none' : 'linear-gradient(135deg,#7C5CFF,#4D7CFE 55%,#22D3EE)' })}
        >
          <span className="font-semibold" style={type(13)}>{label}</span>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-[80%] rounded-full bg-white/45" />
            <div className="h-1.5 w-[55%] rounded-full bg-white/30" />
          </div>
          <span className="mt-auto self-start rounded-lg px-3 py-1.5 text-[10px] font-semibold text-[#0B0E14]" style={{ backgroundColor: '#FFFFFF' }}>
            {copy('cta', 'Open')}
          </span>
        </div>
      );
    case 'card-stat':
      return (
        <div className="w-full h-full p-4 flex flex-col" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9B99A6]">{label}</span>
          <span className="mt-1 text-[26px] leading-none font-semibold" style={text(26)}>{copy('value', '₹48,210')}</span>
          <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ background: '#22D3EE22', color: '#0E8A9A' }}>
            {copy('delta', '▲ 12.4%')}
          </span>
          <div className="mt-auto flex items-end gap-1 h-8">
            {[30, 55, 40, 70, 58, 85, 66].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i > 4 ? accent : `${accent}44` }} />
            ))}
          </div>
        </div>
      );
    case 'card-media':
      return (
        <div className="w-full h-full overflow-hidden flex flex-col" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <div className="h-[58%]" style={{ background: `linear-gradient(140deg, ${accent}88, ${accent}22)` }} />
          <div className="p-3">
            <span className="text-[12px] font-semibold" style={text(12)}>{label}</span>
            <div className="mt-1 h-1.5 w-[70%] rounded-full bg-[#EFEDF6]" />
          </div>
        </div>
      );

    /* ------------------------------------------------------------- text */
    case 'text-display':
      return (
        <div className="w-full h-full flex items-center leading-[0.95] font-semibold" style={{ ...text(42), letterSpacing: tracking != null ? `${tracking}px` : '-1.6px' }}>
          {label}
        </div>
      );
    case 'text-h2':
      return (
        <div className="w-full h-full flex items-center leading-tight font-semibold tracking-tight" style={text(28)}>
          {label}
        </div>
      );
    case 'text-h3':
      return (
        <div className="w-full h-full flex items-center font-semibold" style={text(18)}>
          {label}
        </div>
      );
    case 'text-body':
      return (
        <div className="w-full h-full leading-[1.65]" style={text(14, '#64626F')}>
          {label}
        </div>
      );
    case 'text-caption':
      return (
        <div className="w-full h-full flex items-center font-semibold uppercase" style={{ ...text(11, '#9B99A6'), letterSpacing: tracking != null ? `${tracking}px` : '1.5px' }}>
          {label}
        </div>
      );
    case 'text-quote':
      return (
        <div className="w-full h-full pl-4 border-l-[3px] flex items-center italic leading-snug" style={{ ...text(18), borderColor: accent }}>
          {label}
        </div>
      );
    case 'text-checklist':
      return (
        <div className="w-full h-full flex flex-col justify-center gap-1.5">
          <span className="text-[13px] font-semibold" style={text(13)}>{label}</span>
          {['On-device analysis', 'Reusable templates', 'Share and deploy'].map((item) => (
            <span key={item} className="flex items-center gap-2 text-[12px] text-[#64626F]">
              <span className="w-4 h-4 rounded-full grid place-items-center" style={{ background: '#22D3EE22', color: '#0E8A9A' }}>
                <Check className="w-2.5 h-2.5" />
              </span>
              {item}
            </span>
          ))}
        </div>
      );

    /* ----------------------------------------------------------- inputs */
    case 'input-labelled':
      return (
        <div className="w-full h-full flex flex-col justify-center">
          <span className="text-[10.5px] font-semibold mb-1" style={text(10.5, '#64626F')}>{label}</span>
          <div className="flex-1 min-h-0 max-h-[42px] px-3 flex items-center text-[#9B99A6]" style={box('#FFFFFF', 10, { ...type(12), borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
            {copy('placeholder', 'you@company.com')}
          </div>
        </div>
      );
    case 'input-search':
      return (
        <div className="w-full h-full rounded-full px-3.5 flex items-center gap-2" style={box('#FFFFFF', 999, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <Search className="w-3.5 h-3.5 text-[#9B99A6]" />
          <span className="text-[#9B99A6]" style={type(12)}>{label}</span>
          <span className="ml-auto rounded border border-[#E7E5F0] px-1 text-[9px] text-[#C3C1CE]">{copy('shortcut', '⌘K')}</span>
        </div>
      );
    case 'input-float':
      return (
        <div className="w-full h-full relative px-3 pt-4" style={box('#FFFFFF', 10, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="absolute left-3 top-1.5 font-semibold uppercase tracking-wider" style={{ ...type(9), color: accent }}>
            {label}
          </span>
          <div className="flex items-center h-full pb-3">
            <span className="text-[12px]" style={text(12)}>{copy('value', '••••••••')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9B99A6] ml-auto" />
          </div>
        </div>
      );

    /* ------------------------------------------------------- navigation */
    case 'nav-light':
      return (
        <div className="w-full h-full flex items-center gap-3 px-5" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="w-6 h-6 rounded-md" style={{ background: accent }} />
          <span className="text-[13px] font-semibold" style={text(13)}>{label}</span>
          <div className="ml-auto flex items-center gap-4 text-[11.5px] text-[#64626F]">
            {copyList('links', 'Product,Pricing,Docs').map((link) => (
              <span key={link}>{link}</span>
            ))}
            <span className="rounded-lg px-3 py-1.5 text-white text-[11px] font-semibold" style={{ background: '#0B0E14' }}>{copy('cta', 'Sign in')}</span>
          </div>
        </div>
      );
    case 'nav-dark':
      return (
        <div className="w-full h-full flex items-center gap-3 px-5" style={box('#0B0E14', 12)}>
          <span className="w-6 h-6 rounded-md" style={{ background: accent }} />
          <span className="font-semibold text-white" style={type(13)}>{label}</span>
          <div className="ml-auto flex items-center gap-4 text-[11.5px] text-white/65">
            {copyList('links', 'Product,Pricing').map((link) => (
              <span key={link}>{link}</span>
            ))}
            <span className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[#0B0E14]" style={{ background: '#22D3EE' }}>{copy('cta', 'Get started')}</span>
          </div>
        </div>
      );

    /* ----------------------------------------------------------- badges */
    case 'badge-soft':
      return (
        <div className="w-full h-full rounded-full grid place-items-center font-semibold" style={box(`${accent}1F`, 999, { ...type(10.5), color: accent })}>
          {label}
        </div>
      );
    case 'badge-solid':
      return (
        <div className="w-full h-full rounded-full grid place-items-center font-semibold text-white" style={box(accent, 999, type(10.5))}>
          {label}
        </div>
      );
    case 'badge-dot':
      return (
        <div className="w-full h-full rounded-full grid place-items-center gap-1.5 grid-flow-col px-2" style={box('#FFFFFF', 999, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          <span className="text-[10.5px] font-semibold" style={text(10.5)}>{label}</span>
        </div>
      );

    /* ----------------------------------------------------------- images */
    case 'image-rounded':
      return (
        <div className="w-full h-full grid place-items-center" style={box(`${accent}22`, 12, { border: `1px solid ${strokeColor || `${accent}33`}` })}>
          <span className="font-semibold" style={{ ...type(11), color: accent }}>{label}</span>
        </div>
      );
    case 'image-framed':
      return (
        <div className="w-full h-full p-2 flex flex-col" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <div className="h-3 flex items-center gap-1 pb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A59]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC53D]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
          </div>
          <div className="flex-1 rounded-lg" style={{ background: `linear-gradient(140deg, ${accent}55, ${accent}14)` }} />
          <span className="mt-1.5 font-semibold text-[#64626F]" style={type(10)}>{label}</span>
        </div>
      );
    case 'image-bleed':
      return (
        <div className="w-full h-full relative overflow-hidden" style={box(accent, 8, { backgroundImage: fill ? 'none' : `linear-gradient(120deg, ${accent}66, #22D3EE33)` })}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/50 to-transparent" />
          <span className="absolute bottom-3 left-4 font-semibold text-white" style={type(12)}>{label}</span>
        </div>
      );

    /* ------------------------------------------------------------- data */
    case 'chart-bars':
      return (
        <div className="w-full h-full p-3 flex flex-col" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold" style={text(11)}>{label}</span>
            <span className="text-[9px] text-[#9B99A6]">{copy('caption', 'Last 9 months')}</span>
          </div>
          <div className="mt-2 flex-1 flex items-end gap-1.5">
            {[38, 62, 48, 74, 56, 88, 66, 92, 72].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i > 6 ? accent : `${accent}3D` }} />
            ))}
          </div>
        </div>
      );
    case 'chart-line':
      return (
        <div className="w-full h-full p-3 flex flex-col" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="text-[11px] font-semibold" style={text(11)}>{label}</span>
          <svg viewBox="0 0 200 60" className="mt-2 flex-1 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={accent} stopOpacity="0.35" />
                <stop offset="1" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,48 L25,40 L50,44 L75,28 L100,32 L125,18 L150,24 L175,10 L200,14 L200,60 L0,60 Z" fill="url(#line-fill)" />
            <path d="M0,48 L25,40 L50,44 L75,28 L100,32 L125,18 L150,24 L175,10 L200,14" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'table-default':
      return (
        <div className="w-full h-full overflow-hidden" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <div className="h-8 px-3 flex items-center gap-3 bg-[#F7F7FB] border-b border-[#E7E5F0]">
            <span className="font-semibold text-[#64626F]" style={type(10)}>{label}</span>
            <span className="ml-auto text-[9px] text-[#9B99A6]">{copy('search', 'Search · Filter')}</span>
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-8 px-3 flex items-center gap-3 border-b border-[#F1EFF8] last:border-0">
              <span className="w-2.5 h-2.5 rounded border border-[#E7E5F0]" />
              <span className="h-1.5 w-20 rounded-full bg-[#EFEDF6]" />
              <span className="h-1.5 w-12 rounded-full bg-[#F4F2FA]" />
              <span className="ml-auto h-3.5 w-10 rounded-full" style={{ background: `${accent}22` }} />
            </div>
          ))}
        </div>
      );

    /* -------------------------------------------------------- structure */
    case 'footer-default':
      return (
        <div className="w-full h-full px-5 py-3 flex items-start gap-8" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="text-[11px] font-semibold" style={text(11)}>{label}</span>
          <div className="flex gap-6 text-[10px] text-[#9B99A6]">
            {copyList('links', 'Product,Company,Legal').map((link) => (
              <span key={link}>{link}</span>
            ))}
          </div>
          <span className="ml-auto text-[9.5px] text-[#C3C1CE]">{copy('copyright', '© 2026')}</span>
        </div>
      );
    case 'modal-default':
      return (
        <div className="w-full h-full p-4 flex flex-col" style={box('#FFFFFF', 16, { boxShadow: '0 20px 40px -24px rgba(11,14,20,.4)', borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="text-[13px] font-semibold" style={text(13)}>{label}</span>
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-[88%] rounded-full bg-[#EFEDF6]" />
            <div className="h-1.5 w-[66%] rounded-full bg-[#EFEDF6]" />
          </div>
          <div className="mt-auto flex gap-2">
            <span className="flex-1 h-8 rounded-lg border border-[#E7E5F0] grid place-items-center text-[10px] text-[#64626F]">{copy('cancel', 'Cancel')}</span>
            <span className="flex-1 h-8 rounded-lg grid place-items-center text-[10px] font-semibold text-white" style={{ background: accent }}>{copy('cta', 'Confirm')}</span>
          </div>
        </div>
      );
    case 'avatar-initials':
      return (
        <div className="w-full h-full rounded-full grid place-items-center text-white text-[15px] font-semibold" style={box(accent, 999)}>
          {label.slice(0, 2).toUpperCase()}
        </div>
      );
    case 'avatar-ring':
      return (
        <div className="w-full h-full rounded-full p-[2px]" style={{ background: accent }}>
          <div className="w-full h-full rounded-full grid place-items-center text-[13px] font-semibold" style={box('#FFFFFF', 999)}>
            {label.slice(0, 2).toUpperCase()}
          </div>
        </div>
      );

    /* -------------------------------------------------- missing variants */
    case 'chart-donut': {
      const value = copy('value', '72%');
      return (
        <div
          className="w-full h-full p-3 flex flex-col"
          style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold" style={text(11)}>{label}</span>
            <span className="text-[9px] text-[#9B99A6]">{copy('caption', 'of plan')}</span>
          </div>
          <div className="mt-1 flex-1 grid place-items-center">
            <svg viewBox="0 0 120 120" className="h-[82%] w-[82%]">
              <circle cx="60" cy="60" r="44" fill="none" stroke="#EFEDF6" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={accent}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="199 80"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="58" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700" fill="#0B0E14">
                {value}
              </text>
              <text x="60" y="74" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="600" fill="#9B99A6">
                {copy('sub', 'used')}
              </text>
            </svg>
          </div>
        </div>
      );
    }
    case 'chart-progress': {
      const value = copy('value', '72%');
      return (
        <div
          className="w-full h-full px-3 py-2 flex flex-col justify-center gap-1.5"
          style={box('#FFFFFF', 10, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold" style={text(11)}>{label}</span>
            <span className="text-[10px] font-semibold" style={{ color: accent }}>{value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEDF6]">
            <div className="h-full rounded-full" style={{ width: '72%', background: accent }} />
          </div>
          <span className="text-[8.5px] text-[#9B99A6]">{copy('caption', '72 of 100 GB used')}</span>
        </div>
      );
    }
    case 'badge-count':
      return (
        <div className="w-full h-full grid place-items-center rounded-full text-[10px] font-bold text-white" style={box(accent, 999)}>
          {label}
        </div>
      );
    case 'btn-icon':
      return (
        <div className="w-full h-full grid place-items-center rounded-lg text-[16px] font-semibold" style={box(fill || '#F7F7FB', 10, { color: color || '#0B0E14', borderStyle: 'solid', borderWidth: '1px', borderColor: strokeColor || '#E7E5F0' })}>
          {label}
        </div>
      );
    case 'btn-loading':
      return (
        <div className="w-full h-full flex items-center justify-center gap-2 rounded-lg text-[11px] font-semibold text-white opacity-80" style={box(accent, 10)}>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          {label}
        </div>
      );
    case 'btn-danger':
      return (
        <div className="w-full h-full grid place-items-center rounded-lg text-[11px] font-semibold text-white" style={box(fill || '#D14343', 10)}>
          {label}
        </div>
      );
    case 'btn-split':
      return (
        <div className="flex h-full w-full overflow-hidden rounded-lg" style={box(accent, 10)}>
          <span className="flex-1 grid place-items-center px-2 text-[10.5px] font-semibold text-white">{label}</span>
          <span className="grid w-8 place-items-center border-l border-white/20 text-white"><ChevronDown className="h-3 w-3" /></span>
        </div>
      );
    case 'card-list':
      return (
        <div className="w-full h-full p-3" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="text-[11px] font-semibold" style={text(11)}>{label}</span>
          <div className="mt-2 space-y-1.5">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-2 rounded-md border border-[#F1EFF8] px-2 py-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: `${accent}33` }} />
                <span className="h-1.5 flex-1 rounded-full bg-[#EFEDF6]" />
                <span className="h-1.5 w-6 rounded-full bg-[#F4F2FA]" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'card-pricing':
      return (
        <div className="w-full h-full p-4 flex flex-col" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || accent })}>
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9B99A6]">{copy('plan', 'PRO')}</span>
          <span className="mt-1 text-[24px] font-extrabold tracking-[-0.04em]" style={text(24)}>{label}</span>
          <div className="mt-2 space-y-1">
            {[0, 1, 2].map((row) => (
              <span key={row} className="flex items-center gap-1.5 text-[8.5px] text-[#64626F]">
                <Check className="h-2.5 w-2.5" style={{ color: accent }} /> Feature included
              </span>
            ))}
          </div>
          <span className="mt-auto grid h-7 place-items-center rounded-md text-[9px] font-semibold text-white" style={{ background: accent }}>
            {copy('cta', 'Choose plan')}
          </span>
        </div>
      );
    case 'card-profile':
      return (
        <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <span className="grid h-10 w-10 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: accent }}>{label.slice(0, 2).toUpperCase()}</span>
          <span className="mt-2 text-[11px] font-semibold" style={text(11)}>{label}</span>
          <span className="text-[8.5px] text-[#9B99A6]">{copy('role', 'Product designer')}</span>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-md px-2 py-1 text-[8px] font-semibold text-white" style={{ background: accent }}>Follow</span>
            <span className="rounded-md border border-[#E7E5F0] px-2 py-1 text-[8px] font-semibold text-[#64626F]">Message</span>
          </div>
        </div>
      );
    case 'text-label':
      return <span className="block uppercase" style={{ ...text(11, '#64626F'), letterSpacing: `${tracking ?? 1.5}px`, fontWeight: fontWeight ?? 700 }}>{label}</span>;
    case 'text-link':
      return <span className="block" style={{ ...text(13), color: color || accent, textDecoration: 'underline', textUnderlineOffset: 3 }}>{label}</span>;
    case 'text-code':
      return (
        <div className="w-full h-full rounded-lg bg-[#0B0E14] px-3 py-2 font-mono text-[10px] text-[#B9F6CA]" style={box('#0B0E14', 10)}>
          <span className="text-[#6B7280]">$ </span>{label}
        </div>
      );
    case 'input-textarea':
      return (
        <div className="w-full h-full flex flex-col gap-1" style={box('#FFFFFF', 10, { borderStyle: 'solid', borderWidth: '1px', borderColor: strokeColor || '#E7E5F0', padding: '8px 10px' })}>
          <span className="text-[8.5px] font-semibold text-[#64626F]">{label}</span>
          <span className="h-1.5 w-[88%] rounded-full bg-[#F1EFF8]" />
          <span className="h-1.5 w-[64%] rounded-full bg-[#F7F5FB]" />
        </div>
      );
    case 'input-select':
      return (
        <div className="w-full h-full flex flex-col justify-center gap-1" style={box(fill || '#FFFFFF', 10, { borderStyle: 'solid', borderWidth: '1px', borderColor: strokeColor || '#E7E5F0', padding: '0 10px' })}>
          <span className="text-[8.5px] font-semibold text-[#64626F]">{label}</span>
          <span className="flex items-center justify-between text-[10px] text-[#0B0E14]">
            {copy('value', 'Select an option')} <ChevronDown className="h-3 w-3 text-[#9B99A6]" />
          </span>
        </div>
      );
    case 'input-checkbox':
      return (
        <div className="flex h-full w-full items-center gap-2" style={box('transparent', 0, { padding: 0 })}>
          <span className="grid h-3.5 w-3.5 place-items-center rounded border" style={{ borderColor: accent, background: `${accent}18` }}>
            <Check className="h-2.5 w-2.5" style={{ color: accent }} />
          </span>
          <span className="text-[10px] text-[#0B0E14]" style={text(10)}>{label}</span>
        </div>
      );
    case 'input-toggle':
      return (
        <div className="flex h-full w-full items-center justify-between gap-3">
          <span className="text-[10.5px] font-medium" style={text(10.5)}>{label}</span>
          <span className="relative h-4 w-7 rounded-full" style={{ background: accent }}>
            <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white" />
          </span>
        </div>
      );
    case 'nav-tabs':
      return (
        <div className="flex h-full w-full items-center gap-1 rounded-lg border border-[#E7E5F0] bg-[#FFFFFF] px-1.5" style={box('#FFFFFF', 8, { borderStyle: 'solid', borderWidth: '1px', borderColor: strokeColor || '#E7E5F0' })}>
          {copyList('tabs', 'Projects,Team,Settings').map((tab, index) => (
            <span key={tab} className="rounded-md px-2.5 py-1.5 text-[9.5px] font-semibold" style={index === 0 ? { background: accent, color: '#FFFFFF' } : { color: '#64626F' }}>
              {tab}
            </span>
          ))}
        </div>
      );
    case 'image-avatar-grid':
      return (
        <div className="flex h-full w-full items-center gap-1 overflow-hidden rounded-lg border border-[#E7E5F0] bg-[#FFFFFF] px-2" style={box('#FFFFFF', 10)}>
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className="-ml-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[8px] font-bold text-white first:ml-0" style={{ background: [accent, '#0D99FF', '#FF7A59', '#22D3EE', '#B8860B'][index] }}>
              {['RG', 'AM', 'SK', 'JP', '+4'][index]}
            </span>
          ))}
        </div>
      );
    case 'divider':
      return (
        <div className="flex h-full w-full items-center gap-2">
          <span className="h-px flex-1 bg-[#E7E5F0]" />
          <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#9B99A6]">{label}</span>
          <span className="h-px flex-1 bg-[#E7E5F0]" />
        </div>
      );
    case 'accordion':
      return (
        <div className="w-full h-full overflow-hidden" style={box('#FFFFFF', 12, { borderStyle: 'solid', borderWidth: `${strokeWidth || 1}px`, borderColor: strokeColor || '#E7E5F0' })}>
          <div className="flex items-center justify-between border-b border-[#E7E5F0] px-3 py-2">
            <span className="text-[10px] font-semibold" style={text(10)}>{label}</span>
            <ChevronDown className="h-3 w-3 text-[#9B99A6]" />
          </div>
          <div className="px-3 py-2 text-[8.5px] leading-relaxed text-[#9B99A6]">{copy('answer', 'This answer stays visible while the other rows stay closed.')}</div>
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center justify-between border-t border-[#F1EFF8] px-3 py-2">
              <span className="h-1.5 w-24 rounded-full bg-[#EFEDF6]" />
              <ChevronDown className="h-3 w-3 text-[#C3C1CE]" />
            </div>
          ))}
        </div>
      );
    default:
      return <div className="w-full h-full rounded-lg border border-dashed border-[#E7E5F0] grid place-items-center text-[11px] text-[#9B99A6]">{label}</div>;
  }
};
