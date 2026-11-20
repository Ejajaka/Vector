import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import { PROJECT_TYPES } from '../../data/projectTypes.ts';

interface TemplatePickerModalProps {
  open: boolean;
  projectName: string;
  onPick: (typeId: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

/** Step two of project creation: choose the starting template. */
export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({ open, projectName, onPick, onSkip, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#06080C]/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-[960px] overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[var(--v-shadow-lg)]">
        <div className="flex items-start justify-between border-b border-[var(--v-line)] px-5 py-4">
          <div>
            <p className="v-eyebrow">Step 2 of 2</p>
            <h2 className="v-display mt-1 text-[22px] text-[var(--v-ink)]">Pick a starting point</h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--v-muted)]">
              “{projectName}” is created. Choose the template it opens with — you can change it later.
            </p>
          </div>
          <button type="button" onClick={onClose} className="v-icon-btn h-7 w-7" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto v-scroll px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => onPick(type.id)}
                className="group rounded-xl border border-[var(--v-line)] p-4 text-left transition-colors hover:border-[var(--v-violet)]"
              >
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg" style={{ background: type.accent }} />
                  <span className="text-[13px] font-semibold text-[var(--v-ink)]">{type.name}</span>
                  <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-[var(--v-faint)]">Theme</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--v-muted)]">{type.blurb}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {type.pages.map((page) => (
                    <span key={page.id} className="rounded bg-[var(--v-surface-2)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                      {page.name}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--v-line)] px-5 py-3">
          <p className="text-[10px] text-[var(--v-faint)]">Everything you build stays inside this project.</p>
          <div className="flex gap-1.5">
            <button type="button" onClick={onSkip} className="h-8 rounded-lg border border-[var(--v-line)] px-3 text-[11px] font-semibold text-[var(--v-muted)]">
              Skip for now
            </button>
            <button type="button" onClick={onSkip} className="h-8 rounded-lg bg-[var(--v-ink)] px-3.5 text-[11px] font-semibold text-[var(--v-surface)] inline-flex items-center gap-1.5">
              Open blank canvas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
