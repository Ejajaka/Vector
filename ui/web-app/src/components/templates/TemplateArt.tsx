import React from 'react';
import type { TemplateDefinition } from '../../data/templates.ts';

/**
 * Renders a believable miniature of the template rather than grey bars, so the
 * gallery reads like a design library instead of a wireframe kit.
 */
export const TemplateArt: React.FC<{ template: TemplateDefinition; detail?: boolean; page?: number }> = ({
  template,
  detail,
  page = 0,
}) => {
  const accent = '#7170ff';

  const shell = (children: React.ReactNode) => (
    <div
      className="template-art w-full h-full relative overflow-hidden"
      style={{ backgroundImage: `radial-gradient(120% 100% at 15% 0%, ${accent}26, transparent 55%), linear-gradient(160deg, #141519, #0a0b0d)` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(113,112,255,.16),transparent_58%)]" />
      <div className={`relative h-full w-full ${detail ? 'p-5' : 'p-3'}`}>{children}</div>
    </div>
  );

  // Secondary pages get a neutral layout derived from their block order.
  if (page > 0) {
    const blocks = template.pages?.[page - 1]?.blocks || [];
    return shell(
      <div className="h-full flex flex-col gap-1.5">
        <div className="h-3 flex items-center gap-1.5 rounded bg-[#1a1b1f] px-1.5">
          <span className="w-1.5 h-1.5 rounded-sm" style={{ background: accent }} />
          <span className="h-1 w-8 rounded-full bg-[#e8e8ea]/40" />
          <span className="ml-auto h-1 w-6 rounded-full bg-[#e8e8ea]/20" />
        </div>
        <div className="text-[8px] font-semibold text-[#f7f8f8]/70">{template.pages?.[page - 1]?.name}</div>
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          {blocks.slice(0, 4).map((block, index) => (
            <div key={index} className="rounded bg-[#1a1b1f] p-1.5 flex flex-col gap-1">
              <div className="h-1 w-8 rounded-full" style={{ background: accent }} />
              <div className="h-1 w-full rounded-full bg-[#e8e8ea]/15" />
              <div className="h-1 w-2/3 rounded-full bg-[#e8e8ea]/10" />
              <div className="mt-auto text-[5.5px] text-[#f7f8f8]/40 truncate">{block.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  switch (template.id) {
    case 'saas-dashboard':
      return shell(
        <div className="h-full flex gap-2">
          <div className="w-[16%] rounded-lg bg-[#1a1b1f] p-1.5 flex flex-col gap-1">
            <div className="h-2 w-8 rounded-full bg-[#e8e8ea]/70" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'bg-[#7C5CFF]/70' : 'bg-[#e8e8ea]/15'}`} />
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-1.5">
              {['$48k', '2.1%', '914', '$8.2k'].map((value) => (
                <div key={value} className="rounded-lg bg-[#1e1f23] px-1.5 py-1">
                  <div className="text-[7px] text-[#8a8f98] leading-none">MRR</div>
                  <div className="text-[9px] font-semibold text-[#f7f8f8] leading-none mt-0.5">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex-1 rounded-lg bg-[#1e1f23] p-2 flex items-end gap-1">
              {[40, 62, 48, 78, 55, 88, 68, 92, 60, 74].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i > 6 ? '#7C5CFF' : '#7C5CFF44' }} />
              ))}
            </div>
          </div>
        </div>
      );

    case 'commerce-product':
      return shell(
        <div className="h-full flex gap-2">
          <div className="w-[52%] rounded-lg bg-[#1a1b1f] p-1.5 flex flex-col gap-1.5">
            <div className="flex-1 rounded-md" style={{ background: `linear-gradient(140deg, ${accent}88, ${accent}33)` }} />
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-4 rounded bg-[#222327]" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1.5 pt-1">
            <div className="text-[9px] font-semibold text-[#f7f8f8] leading-tight">Merino Wool Coat</div>
            <div className="text-[11px] font-semibold text-[#f7f8f8]">₹8,400</div>
            <div className="flex gap-1">
              {['S', 'M', 'L', 'XL'].map((size) => (
                <span key={size} className="w-5 h-4 rounded bg-[#1e1f23] grid place-items-center text-[6px] font-semibold text-[#f7f8f8]">
                  {size}
                </span>
              ))}
            </div>
            <div className="mt-auto rounded-md bg-[#e8e8ea] text-[#08090a] text-[7px] font-semibold py-1.5 text-center">Add to bag</div>
          </div>
        </div>
      );

    case 'auth-suite':
      return shell(
        <div className="h-full grid place-items-center">
          <div className="w-[68%] rounded-lg bg-[#222327] p-3 shadow-sm">
            <div className="w-6 h-6 rounded-md mx-auto" style={{ background: accent }} />
            <div className="mt-2 text-[8px] font-semibold text-center text-[#f7f8f8]">Welcome back</div>
            {[0, 1].map((i) => (
              <div key={i} className="mt-1.5 h-4 rounded border border-[#2a2b2f] bg-[#1e1f23]" />
            ))}
            <div className="mt-2 h-4 rounded text-[#08090a] text-[7px] font-semibold grid place-items-center" style={{ background: accent }}>
              Sign in
            </div>
            <div className="mt-1.5 text-[6px] text-center text-[#62666d]">Continue with Google</div>
          </div>
        </div>
      );

    case 'pricing-page':
      return shell(
        <div className="h-full flex flex-col gap-2">
          <div className="h-4 flex items-center justify-between px-1">
            <div className="h-2 w-10 rounded-full bg-[#e8e8ea]/70" />
            <div className="h-2 w-14 rounded-full bg-[#e8e8ea]/20" />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1.5 items-stretch">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`rounded-lg p-1.5 flex flex-col ${i === 1 ? 'bg-[#1e1f23] shadow-md scale-[1.03]' : 'bg-[#1a1b1f]'}`}
              >
                <div className="text-[6px] font-semibold text-[#8a8f98] uppercase">{['Starter', 'Pro', 'Team'][i]}</div>
                <div className="text-[10px] font-semibold text-[#f7f8f8] mt-0.5">₹{['0', '499', '1499'][i]}</div>
                <div className="mt-1 space-y-0.5 flex-1">
                  {[0, 1, 2].map((line) => (
                    <div key={line} className="h-1 w-[80%] rounded-full bg-[#e8e8ea]/12" />
                  ))}
                </div>
                <div
                  className="mt-1 h-3.5 rounded text-[6px] font-semibold grid place-items-center text-[#08090a]"
                  style={{ background: i === 1 ? accent : '#0B0E14' }}
                >
                  Choose
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'landing-hero':
      return shell(
        <div className="h-full flex flex-col">
          <div className="h-4 flex items-center justify-between px-1">
            <div className="h-2 w-10 rounded-full bg-[#e8e8ea]/70" />
            <div className="h-2 w-16 rounded-full bg-[#e8e8ea]/20" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 items-center">
            <div>
              <div className="text-[11px] leading-[1.05] font-semibold text-[#f7f8f8]">Design at the speed of thought</div>
              <div className="mt-1 space-y-0.5">
                <div className="h-1 w-[85%] rounded-full bg-[#e8e8ea]/15" />
                <div className="h-1 w-[60%] rounded-full bg-[#e8e8ea]/15" />
              </div>
              <div className="mt-2 flex gap-1">
                <div className="h-4 w-12 rounded-full text-[#08090a] text-[6px] font-semibold grid place-items-center" style={{ background: accent }}>
                  Start free
                </div>
                <div className="h-4 w-10 rounded-full border border-[#0B0E14]/20" />
              </div>
            </div>
            <div className="h-full rounded-lg" style={{ background: `linear-gradient(140deg, ${accent}aa, ${accent}33)` }} />
          </div>
        </div>
      );

    case 'admin-table':
      return shell(
        <div className="h-full rounded-lg bg-[#1e1f23]/85 overflow-hidden flex flex-col">
          <div className="h-5 flex items-center gap-2 px-2 border-b border-[#2a2b2f]">
            <div className="h-1.5 w-10 rounded-full bg-[#e8e8ea]/60" />
            <div className="ml-auto h-3 w-10 rounded-full bg-[#e8e8ea]/10" />
          </div>
          <div className="h-4 flex items-center gap-2 px-2 bg-[#F7F7FB] border-b border-[#2a2b2f]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 w-8 rounded-full bg-[#e8e8ea]/30" />
            ))}
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex-1 flex items-center gap-2 px-2 border-b border-[#F1EFF8] last:border-0">
              <div className="w-2 h-2 rounded border border-[#2a2b2f]" />
              <div className="h-1 w-12 rounded-full bg-[#e8e8ea]/15" />
              <div className="h-1 w-8 rounded-full bg-[#e8e8ea]/10" />
              <div className="ml-auto h-2.5 w-8 rounded-full" style={{ background: `${accent}33` }} />
            </div>
          ))}
        </div>
      );

    case 'chat-interface':
      return shell(
        <div className="h-full flex gap-1.5">
          <div className="w-[26%] rounded-lg bg-[#1a1b1f] p-1.5 space-y-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`rounded p-1 ${i === 0 ? 'bg-[#1e1f23]' : ''}`}>
                <div className="h-1 w-8 rounded-full bg-[#e8e8ea]/50" />
                <div className="mt-0.5 h-1 w-10 rounded-full bg-[#e8e8ea]/15" />
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="w-[70%] rounded-lg rounded-bl-sm bg-[#1e1f23] px-1.5 py-1">
              <div className="h-1 w-14 rounded-full bg-[#e8e8ea]/20" />
            </div>
            <div className="w-[60%] self-end rounded-lg rounded-br-sm px-1.5 py-1" style={{ background: accent }}>
              <div className="h-1 w-10 rounded-full bg-[#1a1b1f]" />
            </div>
            <div className="w-[75%] rounded-lg rounded-bl-sm bg-[#1e1f23] px-1.5 py-1">
              <div className="h-1 w-16 rounded-full bg-[#e8e8ea]/20" />
            </div>
            <div className="mt-auto h-5 rounded-full bg-[#1e1f23] border border-[#2a2b2f] flex items-center px-2">
              <div className="h-1 w-12 rounded-full bg-[#e8e8ea]/12" />
            </div>
          </div>
        </div>
      );

    case 'mobile-feed':
      return shell(
        <div className="h-full grid place-items-center">
          <div className="w-[52%] h-[92%] rounded-[14px] bg-[#1e1f23] shadow-md p-1.5 flex flex-col gap-1">
            <div className="h-2 w-8 mx-auto rounded-full bg-[#e8e8ea]/15" />
            <div className="h-3 rounded bg-[#F1EFF8]" />
            <div className="flex-1 rounded-md" style={{ background: `linear-gradient(140deg, ${accent}77, ${accent}22)` }} />
            <div className="h-1 w-[70%] rounded-full bg-[#e8e8ea]/20" />
            <div className="h-1 w-[50%] rounded-full bg-[#e8e8ea]/12" />
            <div className="mt-auto h-4 rounded bg-[#e8e8ea] flex items-center justify-around px-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1a1b1f]" />
              ))}
            </div>
          </div>
        </div>
      );

    case 'settings-panel':
      return shell(
        <div className="h-full flex gap-2">
          <div className="w-[24%] rounded-lg bg-[#1a1b1f] p-1.5 space-y-1">
            {['Profile', 'Account', 'Theme', 'Billing', 'Danger'].map((label, i) => (
              <div key={label} className={`text-[6px] px-1 py-0.5 rounded ${i === 0 ? 'bg-[#1e1f23] font-semibold text-[#f7f8f8]' : 'text-[#8a8f98]'}`}>
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-lg bg-[#1e1f23]/85 p-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full" style={{ background: accent }} />
              <div>
                <div className="h-1.5 w-12 rounded-full bg-[#e8e8ea]/50" />
                <div className="mt-0.5 h-1 w-16 rounded-full bg-[#e8e8ea]/15" />
              </div>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3.5 rounded border border-[#2a2b2f] bg-[#1e1f23]" />
            ))}
            <div className="h-3.5 w-20 rounded text-[#08090a] text-[6px] font-semibold grid place-items-center" style={{ background: accent }}>
              Save changes
            </div>
          </div>
        </div>
      );

    case 'portfolio-grid':
      return shell(
        <div className="h-full flex flex-col">
          <div className="flex items-end justify-between px-1">
            <div className="text-[11px] font-semibold text-[#f7f8f8] leading-none">Your Name</div>
            <div className="flex gap-1">
              <div className="h-1 w-4 rounded-full bg-[#e8e8ea]/25" />
              <div className="h-1 w-4 rounded-full bg-[#e8e8ea]/25" />
            </div>
          </div>
          <div className="mt-1 px-1 space-y-0.5">
            <div className="h-1 w-[45%] rounded-full bg-[#e8e8ea]/15" />
          </div>
          <div className="mt-2 flex-1 grid grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-md"
                style={{ background: i % 2 === 0 ? `linear-gradient(140deg, ${accent}88, ${accent}22)` : 'rgba(255,255,255,.75)' }}
              />
            ))}
          </div>
        </div>
      );

    default:
      return shell(
        <div className="h-full flex flex-col gap-1.5">
          <div className="h-3 w-1/2 rounded-full bg-[#e8e8ea]/60" />
          <div className="h-1.5 w-3/4 rounded-full bg-[#e8e8ea]/15" />
          <div className="mt-auto grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 rounded-md bg-[#1a1b1f]" />
            ))}
          </div>
        </div>
      );
  }
};
