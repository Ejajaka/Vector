import React, { useState } from 'react';
import { ArrowRight, Layers, X } from 'lucide-react';

interface FeatureSpotlightProps {
  onStartTour: () => void;
}

const KEY = 'vector_spotlight_pages_v1';

/**
 * A compact announcement row. One feature, one line of copy, one call to
 * action — dismissible and remembered. It sits in the page flow rather than
 * floating over the workspace.
 */
export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({ onStartTour }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === 'dismissed';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(KEY, 'dismissed');
    } catch {
      // ignore
    }
  };

  return (
    <div className="mb-4 hidden items-center gap-3 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-3.5 py-3 xl:flex">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--v-accent-soft)] text-[var(--v-accent-hover)]">
        <Layers className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-[var(--v-ink)]">Introducing Vector Pages</p>
        <p className="mt-0.5 truncate text-[11.5px] text-[var(--v-muted)]">
          Build multi-page flows, type directly on the canvas, and drop images in from your device or clipboard.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          close();
          onStartTour();
        }}
        className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-[var(--v-muted)] transition-colors hover:text-[var(--v-ink)]"
      >
        Take the tour <ArrowRight className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={close}
        className="v-btn v-btn-primary h-7 shrink-0 px-3 text-[11.5px]"
      >
        Try it
      </button>
      <button type="button" onClick={close} className="v-icon-btn h-7 w-7 shrink-0" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
