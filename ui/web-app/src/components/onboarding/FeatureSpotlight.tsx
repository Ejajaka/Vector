import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

interface FeatureSpotlightProps {
  onStartTour: () => void;
}

const KEY = 'vector_spotlight_pages_v1';

/**
 * Figma-style anchored announcement card. One feature, one illustration,
 * one call to action — dismissible and remembered.
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
    <div className="hidden xl:block absolute right-0 top-0 w-[330px] z-20 v-card rounded-[20px] overflow-hidden shadow-[var(--v-shadow-lg)]">
      <div className="flex items-center justify-between px-4 pt-3.5">
        <p className="text-[11.5px] font-bold text-[var(--v-ink)]">Introducing Vector Pages</p>
        <button type="button" onClick={close} className="v-icon-btn w-6 h-6" aria-label="Dismiss">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini illustration */}
      <div className="mx-4 mt-2.5 h-[132px] rounded-xl bg-[var(--v-surface-2)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(124,92,255,.18),transparent_60%)]" />
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="absolute w-[104px] h-[78px] rounded-lg bg-[var(--v-surface)] border border-[var(--v-line)] p-1.5 shadow-sm"
            style={{
              left: 18 + index * 34,
              top: 22 + index * 8,
              transform: `rotate(${(index - 1) * 5}deg)`,
              zIndex: 3 - index,
            }}
          >
            <div className="h-1.5 w-8 rounded-full v-grad" />
            <div className="mt-1.5 space-y-1">
              <div className="h-1 w-full rounded-full bg-[var(--v-surface-2)]" />
              <div className="h-1 w-2/3 rounded-full bg-[var(--v-surface-2)]" />
              <div className="h-6 rounded bg-[var(--v-surface-2)]" />
            </div>
          </div>
        ))}
        <span className="absolute right-3 bottom-2 px-1.5 py-0.5 rounded-md bg-[var(--v-ink)] text-[var(--v-surface)] text-[8.5px] font-bold">
          1 / 3
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[11.5px] leading-relaxed text-[var(--v-muted)]">
          Build multi-page flows, type directly on the canvas, and drop images in from your device or clipboard.
        </p>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              close();
              onStartTour();
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-violet)] hover:underline"
          >
            Take the tour <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={close}
            className="h-8 px-3 rounded-full text-[11px] font-bold text-white"
            style={{ backgroundImage: 'linear-gradient(118deg,#7C5CFF,#4D7CFE 55%,#22D3EE)' }}
          >
            Try it
          </button>
        </div>
      </div>
    </div>
  );
};
