import React from 'react';

/**
 * Purpose-built 64×64 covers for the Assets category list. A scaled-down
 * 1120px navbar is unreadable at this size, so each category gets its own
 * composition instead.
 */
export const CategoryCover: React.FC<{ group: string }> = ({ group }) => {
  const frame = (children: React.ReactNode) => (
    <div className="w-full h-full bg-white grid place-items-center overflow-hidden p-2">{children}</div>
  );

  switch (group) {
    case 'Buttons':
      return frame(
        <div className="w-full space-y-1.5">
          <div className="h-4 rounded-md" style={{ background: '#7C5CFF' }} />
          <div className="h-4 rounded-md border border-[#D9D6E4] bg-white" />
          <div className="h-3 w-2/3 rounded-md" style={{ background: '#EEF0FF' }} />
        </div>
      );

    case 'Cards':
      return frame(
        <div className="relative w-full h-full">
          <div className="absolute left-0 top-1 w-9 h-11 rounded bg-[#F7F7FB] border border-[#E7E5F0] p-1">
            <div className="h-1 w-4 rounded-full bg-[#D9D6E4]" />
            <div className="mt-1 h-1 w-6 rounded-full bg-[#EFEDF6]" />
          </div>
          <div className="absolute right-0 top-3 w-8 h-9 rounded bg-white border border-[#E7E5F0] shadow-sm p-1">
            <div className="h-1 w-3 rounded-full bg-[#7C5CFF]" />
            <div className="mt-1 h-1 w-4 rounded-full bg-[#EFEDF6]" />
          </div>
        </div>
      );

    case 'Text':
      return frame(
        <div className="w-full">
          <p className="text-[22px] leading-none font-semibold text-[#0B0E14] tracking-tight">Aa</p>
          <div className="mt-1.5 space-y-1">
            <div className="h-1 w-full rounded-full bg-[#D9D6E4]" />
            <div className="h-1 w-3/4 rounded-full bg-[#EFEDF6]" />
          </div>
        </div>
      );

    case 'Inputs':
      return frame(
        <div className="w-full space-y-1.5">
          <div className="h-1 w-6 rounded-full bg-[#D9D6E4]" />
          <div className="h-4 rounded-md border border-[#D9D6E4]" />
          <div className="h-4 rounded-md border border-[#D9D6E4] bg-[#F7F7FB]" />
        </div>
      );

    case 'Navigation':
      return frame(
        <div className="w-full space-y-1.5">
          <div className="h-4 rounded-md border border-[#E7E5F0] flex items-center gap-1 px-1">
            <span className="w-1.5 h-1.5 rounded-sm" style={{ background: '#7C5CFF' }} />
            <span className="h-1 w-3 rounded-full bg-[#D9D6E4]" />
            <span className="ml-auto h-2 w-4 rounded" style={{ background: '#0B0E14' }} />
          </div>
          <div className="h-3 rounded-md bg-[#F7F7FB]" />
        </div>
      );

    case 'Badges':
      return frame(
        <div className="flex flex-wrap gap-1 justify-center">
          <span className="px-1.5 py-0.5 rounded-full text-[6px] font-semibold" style={{ background: '#EFE9FF', color: '#7C5CFF' }}>NEW</span>
          <span className="px-1.5 py-0.5 rounded-full text-[6px] font-semibold text-white" style={{ background: '#7C5CFF' }}>PRO</span>
          <span className="px-1.5 py-0.5 rounded-full text-[6px] font-semibold border border-[#E7E5F0] text-[#64626F]">• Live</span>
        </div>
      );

    case 'Images':
      return frame(
        <div className="w-full h-full rounded-md grid place-items-center" style={{ background: 'linear-gradient(140deg,#EFE9FF,#E6F7FB)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C5CFF" strokeWidth="1.6">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M4 18l5-5 4 4 3-3 4 4" />
          </svg>
        </div>
      );

    case 'Data':
      return frame(
        <div className="w-full h-full flex items-end gap-1">
          {[40, 70, 52, 88, 64].map((height, index) => (
            <div key={index} className="flex-1 rounded-t" style={{ height: `${height}%`, background: index > 2 ? '#7C5CFF' : '#E4E0F7' }} />
          ))}
        </div>
      );

    case 'Structure':
      return frame(
        <div className="w-full h-full flex flex-col justify-center gap-1.5">
          <div className="h-8 rounded border border-[#E7E5F0] bg-white shadow-sm p-1">
            <div className="h-1 w-5 rounded-full bg-[#D9D6E4]" />
            <div className="mt-1 h-1 w-8 rounded-full bg-[#EFEDF6]" />
          </div>
          <div className="h-3 rounded bg-[#F7F7FB]" />
        </div>
      );

    default:
      return frame(
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded" style={{ background: '#7C5CFF' }} />
          <div className="w-6 h-6 rounded-full border-2 border-[#7C5CFF]" />
        </div>
      );
  }
};
