import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { PROJECT_TYPES, projectType, type PageKind, type PageVariant } from '../../data/projectTypes.ts';

interface PagePickerModalProps {
  open: boolean;
  projectTypeId?: string;
  onPick: (kind: PageKind, variant: PageVariant) => void;
  onClose: () => void;
}

/**
 * Per-page template choice, constrained to the project's theme.
 * The theme is fixed at project creation; this only picks a page layout.
 */
export const PagePickerModal: React.FC<PagePickerModalProps> = ({ open, projectTypeId, onPick, onClose }) => {
  const theme = projectType(projectTypeId);
  const [kind, setKind] = useState<PageKind | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-[620px] overflow-hidden rounded-xl border border-white/10 bg-[#2C2C2C] text-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)]">
        <div className="flex items-start justify-between px-4 pt-4">
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40">
              {theme.name} theme · locked
            </p>
            <h2 className="mt-1 text-[14px] font-semibold">{kind ? kind.name : 'Add a page'}</h2>
            <p className="mt-0.5 text-[11px] text-white/45">
              {kind ? 'Pick a layout for this page.' : 'Choose the page type, then the layout.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-white/50 hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[56vh] space-y-1.5 overflow-y-auto v-scroll px-4 py-3">
          {!kind &&
            theme.pages.map((pageKind) => (
              <button
                key={pageKind.id}
                type="button"
                onClick={() => setKind(pageKind)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-[#333] p-2.5 text-left hover:border-white/25"
              >
                <span className="h-8 w-8 shrink-0 rounded-md" style={{ background: `${theme.accent}33`, border: `1px solid ${theme.accent}` }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold">{pageKind.name}</span>
                  <span className="block text-[10px] text-white/45">{pageKind.variants.length} layout options</span>
                </span>
              </button>
            ))}

          {kind && (
            <>
              <button type="button" onClick={() => setKind(null)} className="mb-1 inline-flex items-center gap-1 text-[10.5px] font-semibold text-white/50 hover:text-white">
                <ArrowLeft className="h-3 w-3" /> All page types
              </button>
              {kind.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onPick(kind, variant)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-[#333] p-2.5 text-left hover:border-[#0D99FF]"
                >
                  <span
                    className="grid h-10 w-14 shrink-0 place-items-center rounded-md text-[8px] font-bold"
                    style={{ background: theme.surface, color: theme.accent }}
                  >
                    {variant.name.slice(0, 6)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold">{variant.name}</span>
                    <span className="block text-[10px] text-white/45">{variant.description}</span>
                  </span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-2.5">
          <p className="text-[9.5px] text-white/35">
            Theme is fixed for this project — {PROJECT_TYPES.length} project types available at creation only.
          </p>
        </div>
      </div>
    </div>
  );
};
