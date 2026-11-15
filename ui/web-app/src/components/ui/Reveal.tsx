import React, { useEffect, useRef, useState } from 'react';

type RevealTag = 'div' | 'section' | 'article' | 'header' | 'li' | 'span';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before the reveal starts, in milliseconds. */
  delay?: number;
  /** Distance travelled on the Y axis, in pixels. */
  y?: number;
  /** Initial scale. */
  scale?: number;
  /** Initial blur, in pixels. */
  blur?: number;
  /** Keep the element visible after the first reveal (default: true). */
  once?: boolean;
  as?: RevealTag;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * Scroll-triggered entrance wrapper. Elements rise, fade and un-blur as they
 * enter the viewport. Motion is disabled automatically for users who prefer
 * reduced motion (see index.css).
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  y = 32,
  scale = 1,
  blur = 6,
  once = true,
  as: Tag = 'div',
  style,
  id,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const Component = Tag as React.ElementType;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(node);

    // Safety net for environments where IntersectionObserver callbacks are
    // throttled (background tabs, embedded webviews): reveal anything that is
    // already inside the viewport shortly after mount.
    const fallback = window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) setVisible(true);
    }, 1500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [once]);

  const revealStyle = {
    '--reveal-delay': `${delay}ms`,
    '--reveal-y': `${y}px`,
    '--reveal-scale': scale,
    '--reveal-blur': `${blur}px`,
    ...style,
  } as React.CSSProperties;

  return (
    <Component
      ref={ref}
      id={id}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={revealStyle}
    >
      {children}
    </Component>
  );
};
