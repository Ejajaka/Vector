import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Play, X } from 'lucide-react';
import type { ActiveTab } from '../../types/analysis.ts';
import { LessonDemo, type DemoKind } from './LessonDemo.tsx';

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
  demo: DemoKind;
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
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(0);
  }, [lesson.title]);

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
              {guide.steps.map((step, index) => {
                const active = index === activeStep;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    aria-current={active ? 'step' : undefined}
                    className={`lesson-step flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-[var(--v-violet)]/60 bg-[var(--v-violet)]/[0.07]'
                        : 'border-[var(--v-line)] bg-[var(--v-surface-2)] hover:border-[var(--v-line-strong)]'
                    }`}
                    style={{ animationDelay: `${0.08 + index * 0.09}s` }}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                        active
                          ? 'bg-[var(--v-violet)] text-white'
                          : 'bg-[var(--v-violet)]/15 text-[var(--v-violet)]'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className="text-[11.5px] leading-relaxed text-[var(--v-ink)]">{step}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <LessonDemo kind={guide.demo} activeStep={activeStep} onStep={setActiveStep} />
            <p className="mt-2 text-[9px] leading-relaxed text-[var(--v-faint)]">
              This follows the exact step you are reading. Nothing here changes your project.
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
