import React, { useEffect } from 'react';
import { ArrowRight, Clock3, Play, X } from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';

export interface LearnLesson {
  title: string;
  summary: string;
  minutes: number;
  level: string;
  icon: React.ElementType;
  from: string;
  to: string;
}

export interface LessonGuide {
  intro: string;
  steps: string[];
  action: { label: string; tab: ActiveTab };
}

interface LessonDialogProps {
  lesson: LearnLesson;
  guide: LessonGuide;
  onClose: () => void;
  onTry: (tab: ActiveTab) => void;
}

export const LessonDialog: React.FC<LessonDialogProps> = ({ lesson, guide, onClose, onTry }) => {
  const Icon = lesson.icon;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[96] grid place-items-center overflow-y-auto p-3 sm:p-5" role="dialog" aria-modal="true" aria-label={lesson.title}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="lesson-panel relative w-full max-w-[760px] overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[0_50px_140px_-40px_rgba(0,0,0,.9)]">
        <div className="flex items-start gap-3 border-b border-[var(--v-line)] px-5 py-4">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white"
            style={{ backgroundImage: `linear-gradient(140deg, ${lesson.from}, ${lesson.to})` }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="v-eyebrow">Learn · {lesson.level}</p>
            <h2 className="mt-0.5 text-[19px] font-semibold text-[var(--v-ink)]">{lesson.title}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--v-faint)]">
              <Clock3 className="h-3 w-3" /> {lesson.minutes} minute read · plain words, no jargon
            </p>
          </div>
          <button type="button" onClick={onClose} className="v-icon-btn" aria-label="Close lesson">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="text-[12.5px] leading-relaxed text-[var(--v-muted)]">{guide.intro}</p>
            <div className="mt-4 space-y-2.5">
              {guide.steps.map((step, index) => (
                <div
                  key={step}
                  className="lesson-step flex items-start gap-2.5 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface-2)] px-3 py-2.5"
                  style={{ animationDelay: `${0.08 + index * 0.09}s` }}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--v-violet)]/15 text-[10px] font-semibold text-[var(--v-violet)]">
                    {index + 1}
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-[var(--v-ink)]">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lesson-demo relative overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-bg)] p-3">
            <div className="flex items-center gap-1.5 border-b border-[var(--v-line)] pb-2">
              <span className="h-2 w-2 rounded-full bg-[#3a3d44]" />
              <span className="h-2 w-2 rounded-full bg-[#3a3d44]" />
              <span className="h-2 w-2 rounded-full bg-[#3a3d44]" />
              <span className="ml-1 text-[8.5px] text-[var(--v-faint)]">vector — guided step</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-2/3 rounded-full bg-[var(--v-surface-2)]" />
              <div className="lesson-demo-row h-8 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)]" />
              <div className="lesson-demo-row h-8 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)]" style={{ animationDelay: '.8s' }} />
              <div className="lesson-demo-row h-8 rounded-md border border-[var(--v-line)] bg-[var(--v-surface)]" style={{ animationDelay: '1.6s' }} />
            </div>
            <div className="absolute bottom-3 right-3">
              <span className="lesson-ring absolute inset-0 rounded-full" />
              <span className="lesson-cursor relative block h-3 w-3 rounded-full bg-[var(--v-violet)] shadow-[0_0_0_4px_rgba(124,92,255,.2)]" />
            </div>
            <p className="mt-3 text-[9px] leading-relaxed text-[var(--v-faint)]">
              We highlight the next control for you. Nothing here changes your project.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--v-line)] px-5 py-3">
          <p className="text-[10px] text-[var(--v-faint)]">Prefer doing? Open the feature and I’ll stay out of the way.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="v-btn v-btn-ghost h-8 px-3 text-[11px]">
              Close
            </button>
            <button type="button" onClick={() => onTry(guide.action.tab)} className="v-btn v-btn-primary h-8 px-3 text-[11px]">
              <Play className="h-3 w-3" /> {guide.action.label} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
