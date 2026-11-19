import React, { useState } from 'react';
import { ArrowRight, Check, FileText, LayoutTemplate, MessageSquare, Sparkles, X } from 'lucide-react';

interface BuildComposerModalProps {
  open: boolean;
  projectName: string;
  canvasPrompt: string;
  canvasPages: number;
  files: Array<{ name: string; type: string }>;
  optimizerNote?: string;
  onClose: () => void;
  onConnect: (prompt: string) => void;
}

/**
 * Build & generate: gather every source in the project, optimise it into one
 * brief, then hand it to a generator.
 */
export const BuildComposerModal: React.FC<BuildComposerModalProps> = ({
  open,
  projectName,
  canvasPrompt,
  canvasPages,
  files,
  optimizerNote,
  onClose,
  onConnect,
}) => {
  const [useCanvas, setUseCanvas] = useState(true);
  const [useFiles, setUseFiles] = useState(files.length > 0);
  const [useNotes, setUseNotes] = useState(Boolean(optimizerNote));
  const [extra, setExtra] = useState('');

  if (!open) return null;

  const finalPrompt = [
    `Build “${projectName}” as a production-ready web application.`,
    '',
    useCanvas && canvasPrompt ? canvasPrompt : '',
    useFiles && files.length
      ? ['', 'ATTACHED FILES', ...files.map((file) => `- ${file.name} (${file.type || 'file'})`), '- Use the attached assets as the real content where relevant.'].join('\n')
      : '',
    useNotes && optimizerNote ? ['', 'PROMPT REVIEW NOTES', optimizerNote].join('\n') : '',
    extra.trim() ? ['', 'ADDITIONAL REQUIREMENTS', extra.trim()].join('\n') : '',
  ]
    .filter(Boolean)
    .join('\n');

  const Source: React.FC<{ icon: React.ElementType; title: string; body: string; on: boolean; toggle: () => void; disabled?: boolean }> = ({
    icon: Icon,
    title,
    body,
    on,
    toggle,
    disabled,
  }) => (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
        on ? 'border-[var(--v-violet)] bg-[var(--v-surface-2)]' : 'border-[var(--v-line)]'
      } ${disabled ? 'opacity-50' : 'hover:border-[var(--v-violet)]'}`}
    >
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${on ? 'bg-[var(--v-ink)] text-[var(--v-surface)]' : 'bg-[var(--v-surface-2)] text-[var(--v-muted)]'}`}>
        {on ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] font-bold text-[var(--v-ink)]">{title}</span>
        <span className="block text-[10px] text-[var(--v-muted)]">{body}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#06080C]/55 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[var(--v-shadow-lg)]">
        <div className="flex items-start justify-between border-b border-[var(--v-line)] px-5 py-3.5">
          <div>
            <p className="v-eyebrow">Build and generate</p>
            <h2 className="mt-1 text-[16px] font-bold text-[var(--v-ink)]">Compose the final brief</h2>
            <p className="mt-0.5 text-[10.5px] text-[var(--v-muted)]">Everything selected is merged into one prompt for the generator.</p>
          </div>
          <button type="button" onClick={onClose} className="v-icon-btn h-7 w-7" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto v-scroll px-5 py-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-faint)]">Sources</p>
            <Source
              icon={LayoutTemplate}
              title="Canvas brief"
              body={canvasPages ? `${canvasPages} page${canvasPages === 1 ? '' : 's'} with every element and attribute` : 'No canvas yet — open one first'}
              on={useCanvas}
              toggle={() => setUseCanvas((value) => !value)}
              disabled={!canvasPages}
            />
            <Source
              icon={FileText}
              title="Attached files"
              body={files.length ? files.map((file) => file.name).join(', ') : 'No files attached'}
              on={useFiles}
              toggle={() => setUseFiles((value) => !value)}
              disabled={files.length === 0}
            />
            <Source
              icon={MessageSquare}
              title="Prompt review notes"
              body={optimizerNote || 'Run the prompt optimizer to capture gaps'}
              on={useNotes}
              toggle={() => setUseNotes((value) => !value)}
              disabled={!optimizerNote}
            />

            <label className="block pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-faint)]">Add your own instructions</span>
              <textarea
                value={extra}
                onChange={(event) => setExtra(event.target.value)}
                rows={3}
                placeholder="Anything the brief should say that the canvas cannot."
                className="mt-1 w-full resize-none rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-2.5 py-2 text-[11px] text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
              />
            </label>
          </div>

          <div className="flex min-h-0 flex-col">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-faint)]">Merged prompt</p>
            <textarea
              readOnly
              value={finalPrompt}
              className="mt-1 min-h-[220px] flex-1 resize-none rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5 font-mono text-[10px] leading-relaxed text-[var(--v-muted)] outline-none v-scroll"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--v-line)] px-5 py-3">
          <p className="text-[9.5px] text-[var(--v-faint)]">Next: choose Base44, v0, Bolt or Lovable.</p>
          <button
            type="button"
            onClick={() => onConnect(finalPrompt)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[11.5px] font-bold text-white"
            style={{ backgroundImage: 'linear-gradient(118deg,#7C5CFF,#4D7CFE 55%,#22D3EE)' }}
          >
            <Sparkles className="h-3.5 w-3.5" /> Continue to generator <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
