import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Download,
  Lock,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  deleteDesignSystem,
  designSystemPrompt,
  downloadSystem,
  getActiveId,
  importDesignSystem,
  listDesignSystems,
  pagesFromDesignSystem,
  saveDesignSystem,
  setActiveDesignSystem,
  type DesignSystem,
  type DesignTokens,
} from '../services/designSystems.ts';
import type { CanvasPage } from '../data/canvas.ts';

interface DesignSystemsPageProps {
  onOpenEditor: (name: string, pages: CanvasPage[]) => void;
}

const FONTS: Array<{ id: DesignTokens['font']; label: string }> = [
  { id: 'jakarta', label: 'Jakarta (sans)' },
  { id: 'bricolage', label: 'Bricolage (display)' },
  { id: 'georgia', label: 'Georgia (serif)' },
  { id: 'mono', label: 'JetBrains Mono' },
];

const DEFAULT_TOKENS: DesignTokens = {
  primary: '#7C5CFF',
  accent: '#22D3EE',
  surface: '#FFFFFF',
  ink: '#0B0E14',
  font: 'jakarta',
  radius: 12,
  spacing: 8,
};

const STARTERS: Array<{ name: string; note: string; tokens: DesignTokens }> = [
  {
    name: 'Midnight',
    note: 'Deep dark surfaces, violet primary, soft blue accent.',
    tokens: { primary: '#7170FF', accent: '#6EA8FE', surface: '#08090A', ink: '#F7F8F8', font: 'jakarta', radius: 10, spacing: 8 },
  },
  {
    name: 'Paper',
    note: 'Clean white surfaces with a confident indigo primary and warm coral accent.',
    tokens: { primary: '#5E6AD2', accent: '#FF7A59', surface: '#FFFFFF', ink: '#17171A', font: 'bricolage', radius: 14, spacing: 8 },
  },
  {
    name: 'Editorial',
    note: 'Warm paper, serif display type and a restrained rust accent.',
    tokens: { primary: '#1C1917', accent: '#C2410C', surface: '#F7F3EC', ink: '#1C1917', font: 'georgia', radius: 6, spacing: 8 },
  },
  {
    name: 'Cobalt',
    note: 'Bright blue primary with a golden secondary for dashboards.',
    tokens: { primary: '#0D99FF', accent: '#FFC53D', surface: '#FFFFFF', ink: '#0B1220', font: 'jakarta', radius: 12, spacing: 8 },
  },
  {
    name: 'Mauve',
    note: 'Soft violet with a rose accent and generous corners.',
    tokens: { primary: '#8B5CF6', accent: '#F472B6', surface: '#FCFAFF', ink: '#211A2E', font: 'bricolage', radius: 16, spacing: 10 },
  },
  {
    name: 'Mono',
    note: 'Monochrome, square corners and monospace type for technical products.',
    tokens: { primary: '#111111', accent: '#6B6B6B', surface: '#FAFAFA', ink: '#111111', font: 'mono', radius: 2, spacing: 8 },
  },
];

interface FormState {
  id?: string;
  name: string;
  note: string;
  tokens: DesignTokens;
}

export const DesignSystemsPage: React.FC<DesignSystemsPageProps> = ({ onOpenEditor }) => {
  const [systems, setSystems] = useState<DesignSystem[]>(() => listDesignSystems());
  const [activeId, setActiveIdState] = useState<string | null>(() => getActiveId());
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setSystems(listDesignSystems());
    setActiveIdState(getActiveId());
  };

  const startCreate = () => setForm({ name: '', note: '', tokens: { ...DEFAULT_TOKENS } });
  const startEdit = (system: DesignSystem) =>
    setForm({ id: system.id, name: system.name, note: system.note || '', tokens: { ...system.tokens } });

  const commit = () => {
    if (!form) return;
    if (!form.name.trim()) {
      setError('Give the system a name.');
      return;
    }
    saveDesignSystem({ id: form.id, name: form.name, note: form.note, tokens: form.tokens });
    setForm(null);
    setError('');
    refresh();
  };

  const useForPrompts = (system: DesignSystem) => {
    setActiveDesignSystem(system.id);
    refresh();
  };

  const useStarter = (preset: (typeof STARTERS)[number]) => {
    const created = saveDesignSystem({ name: preset.name, note: preset.note, tokens: preset.tokens });
    setActiveDesignSystem(created.id);
    refresh();
  };

  const createTemplate = (system: DesignSystem) => {
    setActiveDesignSystem(system.id);
    refresh();
    onOpenEditor(system.name, pagesFromDesignSystem(system));
  };

  const active = systems.find((system) => system.id === activeId) || null;

  return (
    <div className="space-y-5 v-fade-up">
      {/* Private notice */}
      <section className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-4 py-3 text-[11.5px] leading-relaxed text-[var(--v-muted)]">
        <b className="text-[var(--v-ink)]">Private to this workspace.</b> Design systems here belong to your organisation. They are not published to
        any public library, and only members of this workspace can open or attach them. There are no third-party brand
        presets.
      </section>

      {/* Header */}
      <section className="flex flex-col gap-3 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="v-eyebrow">Design system</p>
          <h1 className="v-display mt-1.5 text-[24px] text-[var(--v-ink)] sm:text-[28px]">Your tokens, your prompts</h1>
          <p className="mt-1 max-w-xl text-[12.5px] text-[var(--v-muted)]">
            Define the colours, type and radius once. While a system is active, every prompt you build carries it —
            and you can generate a starter template that already wears it.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-9 rounded-lg border border-[var(--v-line)] px-3 text-[11.5px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface-2)] inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="v-btn v-btn-primary h-9 px-3.5 text-[11.5px]"
          >
            <Plus className="w-3.5 h-3.5" /> New system
          </button>
        </div>
      </section>

      {error && <p className="text-[11.5px] text-[var(--v-coral)]">{error}</p>}

      {/* Starter token sets */}
      <section className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[12.5px] font-semibold text-[var(--v-ink)]">Start from a token set</p>
            <p className="mt-0.5 text-[10.5px] text-[var(--v-muted)]">
              Generic starters. Rename and edit any of them; they stay private to this workspace.
            </p>
          </div>
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--v-violet)]" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STARTERS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => useStarter(preset)}
              className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5 text-left transition-colors hover:border-[var(--v-violet)]"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-semibold text-[var(--v-ink)]">{preset.name}</span>
                <span className="flex gap-1">
                  {[preset.tokens.primary, preset.tokens.accent, preset.tokens.surface].map((colour) => (
                    <span key={colour} className="h-3.5 w-3.5 rounded-full border border-[var(--v-line)]" style={{ background: colour }} />
                  ))}
                </span>
              </span>
              <span className="mt-1 block text-[9.5px] leading-relaxed text-[var(--v-muted)]">{preset.note}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Active */}
      {active && (
        <section className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FBF7] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#0C7A5B]">
              <Check className="w-2.5 h-2.5" /> Attached to prompts
            </span>
            <p className="text-[12.5px] font-semibold text-[var(--v-ink)]">{active.name}</p>
            <div className="flex gap-1">
              {[active.tokens.primary, active.tokens.accent, active.tokens.surface, active.tokens.ink].map((colour) => (
                <span key={colour} className="h-4 w-4 rounded-full border border-[var(--v-line)]" style={{ background: colour }} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveDesignSystem(null);
                refresh();
              }}
              className="ml-auto text-[10.5px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]"
            >
              Detach
            </button>
          </div>
          <pre className="mt-2.5 max-h-[120px] overflow-auto v-scroll rounded-lg bg-[var(--v-surface-2)] p-2.5 font-mono text-[9.5px] leading-relaxed text-[var(--v-muted)]">
            {designSystemPrompt(active)}
          </pre>
        </section>
      )}

      {/* List */}
      {systems.length === 0 ? (
        <section className="rounded-lg border border-dashed border-[var(--v-line)] bg-[var(--v-surface-2)] p-10 text-center">
          <Palette className="mx-auto h-6 w-6 text-[var(--v-faint)]" />
          <p className="mt-2 text-[13.5px] font-semibold text-[var(--v-ink)]">No design system yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[11.5px] text-[var(--v-muted)]">
            Create one from your organisation's documented colours and type. It stays inside this workspace.
          </p>
          <button type="button" onClick={startCreate} className="mt-3 v-btn v-btn-primary h-9 px-4 text-[12px]">
            <Plus className="w-3.5 h-3.5" /> Create design system
          </button>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {systems.map((system) => {
            const isActive = system.id === activeId;
            return (
              <article
                key={system.id}
                className={`rounded-lg border bg-[var(--v-surface)] p-4 ${
                  isActive ? 'border-[var(--v-violet)]' : 'border-[var(--v-line)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 shrink-0 text-[var(--v-faint)]" />
                      <p className="truncate text-[12.5px] font-semibold text-[var(--v-ink)]">{system.name}</p>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[var(--v-faint)]">
                      {system.tokens.font} · {system.tokens.radius}px radius · {system.tokens.spacing}px grid
                    </p>
                  </div>
                  {isActive && (
                    <span className="shrink-0 rounded-full bg-[#F0FBF7] px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-[#0C7A5B]">
                      Active
                    </span>
                  )}
                </div>

                {/* Token preview */}
                <div className="mt-3 rounded-xl border border-[var(--v-line)] p-2.5" style={{ background: system.tokens.surface }}>
                  <div className="flex items-center gap-1.5">
                    <span className="h-6 w-6 rounded-md" style={{ background: system.tokens.primary }} />
                    <span className="h-2 w-16 rounded-full" style={{ background: system.tokens.ink }} />
                    <span className="ml-auto rounded px-2 py-1 text-[8px] font-semibold text-white" style={{ background: system.tokens.primary }}>
                      Button
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-3/4 rounded-full" style={{ background: `${system.tokens.ink}22` }} />
                  <div className="mt-1 h-2 w-1/2 rounded-full" style={{ background: `${system.tokens.ink}14` }} />
                  <div className="mt-2 flex gap-1">
                    <span className="h-1.5 w-6 rounded-full" style={{ background: system.tokens.accent }} />
                    <span className="h-1.5 w-6 rounded-full" style={{ background: system.tokens.primary }} />
                  </div>
                </div>

                {system.note && <p className="mt-2 line-clamp-2 text-[10.5px] text-[var(--v-muted)]">{system.note}</p>}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => useForPrompts(system)}
                    className={`h-7 rounded-md px-2.5 text-[10px] font-semibold ${
                      isActive ? 'bg-[var(--v-surface-2)] text-[var(--v-muted)]' : 'bg-[var(--v-ink)] text-[var(--v-surface)]'
                    }`}
                  >
                    {isActive ? 'Attached' : 'Use for prompts'}
                  </button>
                  <button
                    type="button"
                    onClick={() => createTemplate(system)}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--v-line)] px-2.5 text-[10px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface-2)]"
                  >
                    <Sparkles className="h-3 w-3" /> Create template
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(system)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[var(--v-line)] text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSystem(system)}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[var(--v-line)] text-[var(--v-muted)] hover:bg-[var(--v-surface-2)]"
                    aria-label="Export"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteDesignSystem(system.id);
                      refresh();
                    }}
                    className="grid h-7 w-7 place-items-center rounded-md border border-[var(--v-line)] text-[var(--v-coral)] hover:bg-[var(--v-surface-2)]"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          try {
            importDesignSystem(await file.text());
            setError('');
            refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed.');
          }
        }}
      />

      {/* Editor */}
      {form && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <div className="absolute inset-0 bg-[#06080C]/55 backdrop-blur-sm" onClick={() => setForm(null)} aria-hidden="true" />
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[var(--v-shadow-lg)]">
            <div className="flex items-start justify-between border-b border-[var(--v-line)] px-5 py-3.5">
              <div>
                <p className="v-eyebrow">{form.id ? 'Edit system' : 'New system'}</p>
                <h2 className="mt-1 text-[16px] font-semibold text-[var(--v-ink)]">Design tokens</h2>
              </div>
              <button type="button" onClick={() => setForm(null)} className="v-icon-btn h-7 w-7" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto v-scroll px-5 py-4">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Acme internal UI"
                  className="v-input mt-1 h-9 px-3 text-[12px]"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">Note for the prompt</span>
                <textarea
                  value={form.note}
                  onChange={(event) => setForm({ ...form, note: event.target.value })}
                  rows={2}
                  placeholder="Documented rules, e.g. no gradients, 8px grid, sentence case."
                  className="mt-1 w-full resize-none rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2 text-[12px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                {([
                  ['primary', 'Primary'],
                  ['accent', 'Accent'],
                  ['surface', 'Surface'],
                  ['ink', 'Text'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--v-line)] px-2 py-1.5">
                    <input
                      type="color"
                      value={form.tokens[key]}
                      onChange={(event) =>
                        setForm({ ...form, tokens: { ...form.tokens, [key]: event.target.value } })
                      }
                      className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                      aria-label={label}
                    />
                    <span className="text-[11px] font-semibold text-[var(--v-ink)]">{label}</span>
                    <span className="ml-auto font-mono text-[9px] text-[var(--v-faint)]">{form.tokens[key].toUpperCase()}</span>
                  </label>
                ))}
              </div>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">Typeface</span>
                <select
                  value={form.tokens.font}
                  onChange={(event) =>
                    setForm({ ...form, tokens: { ...form.tokens, font: event.target.value as DesignTokens['font'] } })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[12px] text-[var(--v-ink)] outline-none"
                >
                  {FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">
                    Radius · {form.tokens.radius}px
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    value={form.tokens.radius}
                    onChange={(event) => setForm({ ...form, tokens: { ...form.tokens, radius: Number(event.target.value) } })}
                    className="mt-2 w-full accent-[var(--v-violet)]"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">
                    Spacing · {form.tokens.spacing}px
                  </span>
                  <input
                    type="range"
                    min={2}
                    max={16}
                    value={form.tokens.spacing}
                    onChange={(event) => setForm({ ...form, tokens: { ...form.tokens, spacing: Number(event.target.value) } })}
                    className="mt-2 w-full accent-[var(--v-violet)]"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-[var(--v-line)] p-3" style={{ background: form.tokens.surface }}>
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-md" style={{ background: form.tokens.primary }} />
                  <span className="text-[12px] font-semibold" style={{ color: form.tokens.ink }}>
                    {form.name || 'Preview'}
                  </span>
                  <span
                    className="ml-auto px-2 py-1 text-[9px] font-semibold text-white"
                    style={{ background: form.tokens.primary, borderRadius: form.tokens.radius }}
                  >
                    Button
                  </span>
                </div>
                <div className="mt-2 h-2 w-3/4 rounded-full" style={{ background: `${form.tokens.ink}22` }} />
                <div className="mt-1 h-2 w-1/2 rounded-full" style={{ background: `${form.tokens.ink}14` }} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[var(--v-line)] px-5 py-3">
              <p className="text-[9.5px] text-[var(--v-faint)]">Stored in this workspace only.</p>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setForm(null)} className="h-8 rounded-lg border border-[var(--v-line)] px-3 text-[11px] font-semibold text-[var(--v-muted)]">
                  Cancel
                </button>
                <button type="button" onClick={commit} className="h-8 rounded-lg bg-[var(--v-ink)] px-3.5 text-[11px] font-semibold text-[var(--v-surface)]">
                  Save system
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
