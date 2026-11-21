import React, { useMemo, useState } from 'react';
import { Check, Palette, Plus, Sparkles, X } from 'lucide-react';
import {
  applySystemToProject,
  getActiveId,
  listDesignSystems,
  saveDesignSystem,
  setActiveDesignSystem,
  type DesignSystem,
  type DesignTokens,
} from '../../services/designSystems.ts';
import { DOMAIN_PRESETS } from '../../data/designPresets.ts';
import type { CanvasPage } from '../../data/canvas.ts';

interface DesignSystemPickerDialogProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onApplied: (system: DesignSystem, pages: CanvasPage[]) => void;
}

const BASE_TOKENS: DesignTokens = {
  primary: '#5E6AD2',
  accent: '#22D3EE',
  surface: '#FFFFFF',
  ink: '#17171A',
  font: 'jakarta',
  radius: 12,
  spacing: 8,
};

type Choice =
  | { kind: 'existing'; system: DesignSystem }
  | { kind: 'preset'; preset: (typeof DOMAIN_PRESETS)[number] }
  | null;

export const DesignSystemPickerDialog: React.FC<DesignSystemPickerDialogProps> = ({
  open,
  projectId,
  onClose,
  onApplied,
}) => {
  const [systems] = useState<DesignSystem[]>(() => listDesignSystems());
  const [activeId] = useState<string | null>(() => getActiveId());
  const [choice, setChoice] = useState<Choice>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [tokens, setTokens] = useState<DesignTokens>({ ...BASE_TOKENS });
  const [error, setError] = useState('');

  const selectedName = choice && choice.kind === 'existing' ? choice.system.name : choice?.preset.name || '';
  const selectedTokens = choice && choice.kind === 'existing' ? choice.system.tokens : choice?.preset.tokens || null;

  const choosePreset = (preset: (typeof DOMAIN_PRESETS)[number]) => {
    setChoice({ kind: 'preset', preset });
    setCreating(false);
  };

  const createSystem = () => {
    if (!name.trim()) {
      setError('Give the system a name.');
      return;
    }
    const created = saveDesignSystem({ name, tokens });
    setChoice({ kind: 'existing', system: created });
    setCreating(false);
    setError('');
  };

  const apply = () => {
    if (!choice) return;
    const system =
      choice.kind === 'existing'
        ? choice.system
        : saveDesignSystem({
            name: choice.preset.name,
            note: choice.preset.note,
            tokens: choice.preset.tokens,
          });
    setActiveDesignSystem(system.id);
    const pages = applySystemToProject(projectId, system) || [];
    onApplied(system, pages);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[97] grid place-items-center p-3" role="dialog" aria-modal="true" aria-label="Design system">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[92vh] w-full max-w-[780px] flex-col overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[var(--v-shadow-lg)]">
        <div className="flex shrink-0 items-start gap-3 border-b border-[var(--v-line)] px-5 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--v-violet)]/10 text-[var(--v-violet)]">
            <Palette className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="v-eyebrow">Sources</p>
            <h2 className="mt-0.5 text-[16px] font-semibold text-[var(--v-ink)]">Design system</h2>
            <p className="mt-0.5 text-[10px] text-[var(--v-faint)]">
              Pick an existing system or a popular domain combination. You will be asked before the canvas changes.
            </p>
          </div>
          <button type="button" onClick={onClose} className="v-icon-btn" aria-label="Close design system">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="v-scroll min-h-0 flex-1 overflow-y-auto p-4">
          {!creating ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[var(--v-ink)]">Existing systems</p>
                <button type="button" onClick={() => { setCreating(true); setChoice(null); }} className="v-btn v-btn-primary h-7 px-2.5 text-[10px]">
                  <Plus className="h-3 w-3" /> New system
                </button>
              </div>
              {systems.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-[var(--v-line)] p-4 text-center text-[10.5px] text-[var(--v-muted)]">
                  No saved systems yet. Choose a domain combination below or create one.
                </p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {systems.map((system) => {
                    const active = system.id === activeId;
                    return (
                      <button
                        key={system.id}
                        type="button"
                        onClick={() => setChoice({ kind: 'existing', system })}
                        className={`rounded-lg border p-2.5 text-left transition-colors ${
                          choice?.kind === 'existing' && choice.system.id === system.id
                            ? 'border-[var(--v-violet)] bg-[var(--v-violet)]/5'
                            : 'border-[var(--v-line)] bg-[var(--v-surface-2)] hover:border-[var(--v-violet)]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex gap-1">
                            {[system.tokens.primary, system.tokens.accent, system.tokens.surface].map((colour) => (
                              <span key={colour} className="h-4 w-4 rounded-full border border-[var(--v-line)]" style={{ background: colour }} />
                            ))}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[var(--v-ink)]">{system.name}</span>
                          {active && <span className="rounded bg-[#F0FBF7] px-1.5 py-0.5 text-[8px] font-semibold uppercase text-[#0C7A5B]">Active</span>}
                        </span>
                        <span className="mt-1 block text-[9px] text-[var(--v-faint)]">
                          {system.tokens.font} · {system.tokens.radius}px radius
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[var(--v-violet)]" />
                <p className="text-[11px] font-semibold text-[var(--v-ink)]">Popular colour combinations by domain</p>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {DOMAIN_PRESETS.map((preset) => (
                  <button
                    key={`${preset.domain}-${preset.name}`}
                    type="button"
                    onClick={() => choosePreset(preset)}
                    className={`rounded-lg border p-2.5 text-left transition-colors ${
                      choice?.kind === 'preset' && choice.preset.name === preset.name
                        ? 'border-[var(--v-violet)] bg-[var(--v-violet)]/5'
                        : 'border-[var(--v-line)] bg-[var(--v-surface-2)] hover:border-[var(--v-violet)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex gap-1">
                        {[preset.tokens.primary, preset.tokens.accent, preset.tokens.surface].map((colour) => (
                          <span key={colour} className="h-4 w-4 rounded-full border border-[var(--v-line)]" style={{ background: colour }} />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--v-faint)]">{preset.domain}</span>
                        <span className="block truncate text-[11px] font-semibold text-[var(--v-ink)]">{preset.name}</span>
                      </span>
                    </span>
                    <span className="mt-1 block text-[9px] leading-relaxed text-[var(--v-muted)]">{preset.note}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-[460px]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-[var(--v-ink)]">New design system</p>
                <button type="button" onClick={() => setCreating(false)} className="text-[10px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]">
                  Back to existing
                </button>
              </div>
              <label className="mt-3 block">
                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--v-faint)]">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Client brand or product name"
                  className="mt-1 h-8 w-full rounded-md border border-[var(--v-line)] bg-[var(--v-surface-2)] px-2 text-[11px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([
                  ['primary', 'Primary'],
                  ['accent', 'Accent'],
                  ['surface', 'Surface'],
                  ['ink', 'Text'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
                    <span className="block h-8 w-full rounded" style={{ background: tokens[key] }} />
                    <span className="mt-1.5 flex items-center gap-1.5">
                      <input
                        type="color"
                        value={tokens[key]}
                        onChange={(event) => setTokens((current) => ({ ...current, [key]: event.target.value }))}
                        aria-label={label}
                        className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <span className="text-[9px] font-semibold text-[var(--v-ink)]">{label}</span>
                      <span className="ml-auto font-mono text-[8px] text-[var(--v-faint)]">{tokens[key]}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <label className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
                  <span className="text-[8.5px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Typeface</span>
                  <select
                    value={tokens.font}
                    onChange={(event) => setTokens((current) => ({ ...current, font: event.target.value as DesignTokens['font'] }))}
                    className="mt-1 h-7 w-full rounded border border-[var(--v-line)] bg-[var(--v-surface)] px-1 text-[9px] text-[var(--v-ink)]"
                  >
                    {['jakarta', 'bricolage', 'georgia', 'mono'].map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </label>
                <label className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
                  <span className="text-[8.5px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Radius · {tokens.radius}px</span>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    value={tokens.radius}
                    onChange={(event) => setTokens((current) => ({ ...current, radius: Number(event.target.value) }))}
                    className="mt-3 w-full accent-[var(--v-violet)]"
                  />
                </label>
                <label className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2">
                  <span className="text-[8.5px] uppercase tracking-[0.1em] text-[var(--v-faint)]">Spacing · {tokens.spacing}px</span>
                  <input
                    type="range"
                    min={2}
                    max={16}
                    value={tokens.spacing}
                    onChange={(event) => setTokens((current) => ({ ...current, spacing: Number(event.target.value) }))}
                    className="mt-3 w-full accent-[var(--v-violet)]"
                  />
                </label>
              </div>
              {error && <p className="mt-2 text-[10px] text-[var(--v-coral)]">{error}</p>}
              <button type="button" onClick={createSystem} className="v-btn v-btn-primary mt-3 h-8 px-3 text-[10.5px]">
                Create and select
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--v-line)] px-4 py-3">
          {choice ? (
            <>
              <span className="flex items-center gap-1.5 text-[10px] text-[var(--v-muted)]">
                {[selectedTokens?.primary, selectedTokens?.accent, selectedTokens?.surface].filter(Boolean).map((colour) => (
                  <span key={colour} className="h-3.5 w-3.5 rounded-full border border-[var(--v-line)]" style={{ background: colour }} />
                ))}
                Apply <b className="text-[var(--v-ink)]">{selectedName}</b> to this canvas?
              </span>
              <button type="button" onClick={apply} className="v-btn v-btn-primary ml-auto h-8 px-3 text-[10.5px]">
                <Check className="h-3.5 w-3.5" /> Apply to canvas
              </button>
              <button type="button" onClick={() => setChoice(null)} className="v-btn v-btn-ghost h-8 px-3 text-[10.5px]">
                Not now
              </button>
            </>
          ) : (
            <p className="text-[10px] text-[var(--v-faint)]">Select a system or combination to apply it to the canvas.</p>
          )}
        </div>
      </div>
    </div>
  );
};
