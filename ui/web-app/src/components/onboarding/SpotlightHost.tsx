import React, { useEffect, useState } from 'react';
import { Spotlight } from './Spotlight.tsx';
import { markSpotlightSeen, nextSpotlight, type SpotlightDef } from '../../data/spotlights.ts';

interface SpotlightHostProps {
  page: SpotlightDef['page'];
  /** Delay before the first card appears, so the page can paint. */
  delay?: number;
  onLearnMore?: (item: SpotlightDef) => void;
}

/**
 * Shows the first unseen tip for a page, then advances to the next one when
 * dismissed. Each tip is remembered individually.
 */
export const SpotlightHost: React.FC<SpotlightHostProps> = ({ page, delay = 1200, onLearnMore }) => {
  const [current, setCurrent] = useState<SpotlightDef | null>(null);

  useEffect(() => {
    setCurrent(null);
    const timer = window.setTimeout(() => setCurrent(nextSpotlight(page)), delay);
    return () => window.clearTimeout(timer);
  }, [page, delay]);

  if (!current) return null;

  const dismiss = () => {
    markSpotlightSeen(current.page, current.id);
    setCurrent(nextSpotlight(page));
  };

  return (
    <Spotlight
      title={current.title}
      body={current.body}
      art={current.art}
      anchor={current.anchor}
      onDismiss={dismiss}
      onLearnMore={
        onLearnMore
          ? () => {
              onLearnMore(current);
              dismiss();
            }
          : undefined
      }
    />
  );
};
