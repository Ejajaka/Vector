import React, { useEffect, useRef, useState } from 'react';
import { StyledElement } from './StyledElement.tsx';
import type { StyleKey } from '../../data/styles.ts';
import { REQUIRED_ATTRS, type CompiledElement } from '../../services/promptCompiler.ts';

interface Props {
  elements: CompiledElement[];
  dark?: boolean;
  /** Shown when there is nothing to draw yet. */
  empty?: React.ReactNode;
}

/** Placeholder copy so a wireframe never renders as a blank rectangle. */
const SAMPLE: Record<string, string> = {
  navbar: 'Brand',
  heading: 'Your headline',
  text: 'Supporting copy that explains the value in one or two lines.',
  button: 'Button',
  input: 'Field',
  card: 'Card title',
  image: 'Image',
  table: 'Table',
  chart: 'Chart',
  modal: 'Dialog',
  checkbox: 'Remember me',
  footer: 'Footer',
};

function styleFor(element: CompiledElement): StyleKey {
  if (element.preset) return element.preset as StyleKey;
  switch (element.kind) {
    case 'navbar': return 'nav-light';
    case 'heading': return element.h >= 64 ? 'text-display' : 'text-h2';
    case 'text': return 'text-body';
    case 'button': return 'btn-solid';
    case 'input': return 'input-labelled';
    case 'card': return 'card-media';
    case 'image': return 'image-rounded';
    case 'table': return 'table-default';
    case 'chart': return 'chart-bars';
    case 'modal': return 'modal-default';
    case 'footer': return 'footer-default';
    default: return 'rect';
  }
}

const CheckboxRow: React.FC<{ element: CompiledElement; dark: boolean }> = ({ element, dark }) => (
  <div className="flex h-full w-full items-center gap-2">
    <span
      className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border"
      style={{ borderColor: element.colour || (dark ? '#4B4F58' : '#C9C7D4') }}
    />
    <span className="text-[13px]" style={{ color: dark ? '#F5F5F7' : '#0B0E14' }}>
      {element.label || SAMPLE.checkbox}
    </span>
  </div>
);

/**
 * Draws the compiler's 1200×800 board with the editor's real component
 * renderer, then scales the whole board to fit the panel. Same coordinates,
 * same components — so a button looks like a button.
 */
export const WireframePreview: React.FC<Props> = ({ elements, dark = false, empty }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const measure = () => setScale(node.clientWidth / 1200);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative aspect-[3/2] w-full overflow-hidden rounded-lg shadow-sm"
      style={{ background: dark ? '#0B0E14' : '#FFFFFF' }}
    >
      {elements.length === 0 ? (
        <div className="absolute inset-0 grid place-items-center p-4 text-center">
          {empty || (
            <p className="text-[11px] text-[#8A8F98]">
              Analyse a prompt and the layout appears here.
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1200,
            height: 800,
            transform: `scale(${scale || 1})`,
            transformOrigin: 'top left',
            opacity: scale ? 1 : 0,
            transition: 'opacity 120ms ease',
          }}
        >
          {elements.map((element) => {
            const missing = (REQUIRED_ATTRS[element.kind] || []).some(
              (attribute) => !element[attribute as keyof CompiledElement]
            );
            const textColour =
              element.colour ||
              (dark && (element.kind === 'heading' || element.kind === 'text')
                ? '#F5F5F7'
                : undefined);

            return (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: element.x,
                  top: element.y,
                  width: element.w,
                  height: element.h,
                }}
              >
                {element.kind === 'checkbox' ? (
                  <CheckboxRow element={element} dark={dark} />
                ) : (
                  <StyledElement
                    style={styleFor(element)}
                    label={element.label || SAMPLE[element.kind] || ''}
                    color={textColour}
                  />
                )}

                {missing && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[6px]"
                    style={{ outline: '1.5px dashed #E5484D', outlineOffset: 2 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
