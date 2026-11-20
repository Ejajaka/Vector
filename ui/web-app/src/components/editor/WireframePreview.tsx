import React, { useEffect, useRef, useState } from 'react';
import { StyledElement } from './StyledElement.tsx';
import type { StyleKey } from '../../data/styles.ts';
import { REQUIRED_ATTRS, type CompiledElement } from '../../services/promptCompiler.ts';

interface Props {
  elements: CompiledElement[];
  dark?: boolean;
  /** Board size in layout coordinates. */
  width?: number;
  height?: number;
  /** Maximum rendered width in the panel. */
  maxWidth?: number;
  empty?: React.ReactNode;
}

/** Placeholder copy so a wireframe never renders as a blank rectangle. */
const SAMPLE: Record<string, string> = {
  background: 'Backdrop',
  navbar: 'Brand',
  heading: 'Your headline',
  text: 'Supporting copy that explains the value in one or two lines.',
  button: 'Button',
  input: 'Field',
  link: 'Learn more',
  card: 'Card title',
  image: 'Image',
  avatar: 'User',
  badge: 'New',
  tabs: 'Overview',
  progress: 'Progress',
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
    case 'link': return 'btn-ghost';
    case 'badge': return 'badge-soft';
    case 'avatar': return 'avatar-initials';
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

const BackdropBlock: React.FC<{ element: CompiledElement }> = ({ element }) => {
  const first = element.colour || '#FFC53D';
  const second = element.colour2 || '#28C76F';
  const diagonal = element.preset === 'split-diagonal';
  const gradient = element.preset === 'gradient';

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: gradient
          ? `linear-gradient(135deg, ${first}, ${second})`
          : diagonal
            ? `linear-gradient(135deg, ${first} 0 49.6%, ${second} 50.4% 100%)`
            : `linear-gradient(180deg, ${first} 0 50%, ${second} 50% 100%)`,
      }}
    >
      {diagonal && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, transparent calc(50% - 1px), rgba(11,14,20,.55) calc(50% - 1px), rgba(11,14,20,.55) calc(50% + 1px), transparent calc(50% + 1px))',
          }}
        />
      )}
    </div>
  );
};

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

const TabsRow: React.FC<{ element: CompiledElement; dark: boolean }> = ({ element, dark }) => {
  const labels = element.label
    ? element.label.split(/[,/|]|\band\b/i).map((part) => part.trim()).filter(Boolean).slice(0, 4)
    : ['Overview', 'Activity', 'Settings'];
  return (
    <div
      className="flex h-full w-full items-center gap-1 rounded-[10px] p-1"
      style={{ background: dark ? '#151923' : '#F1EFF8' }}
    >
      {labels.map((label, index) => (
        <span
          key={label}
          className="flex-1 truncate rounded-[7px] px-2 text-center text-[12px] font-semibold"
          style={{
            lineHeight: '30px',
            background: index === 0 ? (dark ? '#262B38' : '#FFFFFF') : 'transparent',
            color: index === 0 ? (dark ? '#FFFFFF' : '#0B0E14') : '#8A8F98',
            boxShadow: index === 0 ? '0 1px 3px rgba(11,14,20,.08)' : undefined,
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

const ProgressRow: React.FC<{ element: CompiledElement; dark: boolean }> = ({ element, dark }) => (
  <div className="flex h-full w-full flex-col justify-center gap-1.5">
    <span className="text-[11px] font-semibold" style={{ color: dark ? '#F5F5F7' : '#0B0E14' }}>
      {element.label || SAMPLE.progress}
    </span>
    <span
      className="block h-2 w-full overflow-hidden rounded-full"
      style={{ background: dark ? '#262B38' : '#EFEDF6' }}
    >
      <span
        className="block h-full rounded-full"
        style={{ width: '62%', background: element.colour || '#7C5CFF' }}
      />
    </span>
  </div>
);

/**
 * Draws the compiler's board with the editor's real component renderer, then
 * scales the whole board to fit the panel. Same coordinates, same components —
 * so a button looks like a button.
 */
export const WireframePreview: React.FC<Props> = ({
  elements,
  dark = false,
  width = 1200,
  height = 800,
  maxWidth,
  empty,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const measure = () => setScale(node.clientWidth / width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full overflow-hidden rounded-lg shadow-sm"
      style={{
        aspectRatio: `${width} / ${height}`,
        maxWidth: maxWidth ?? (width < 900 ? 240 : 560),
        background: dark ? '#0B0E14' : '#FFFFFF',
      }}
    >
      {elements.length === 0 ? (
        <div className="absolute inset-0 grid place-items-center p-4 text-center">
          {empty || (
            <p className="text-[11px] text-[#8A8F98]">Analyse a prompt and the layout appears here.</p>
          )}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height,
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
                {element.kind === 'background' ? (
                  <BackdropBlock element={element} />
                ) : element.kind === 'checkbox' ? (
                  <CheckboxRow element={element} dark={dark} />
                ) : element.kind === 'tabs' ? (
                  <TabsRow element={element} dark={dark} />
                ) : element.kind === 'progress' ? (
                  <ProgressRow element={element} dark={dark} />
                ) : (
                  <StyledElement
                    style={styleFor(element)}
                    label={element.label || SAMPLE[element.kind] || ''}
                    color={textColour}
                    radius={element.radius}
                    fontFamily={element.fontFamily}
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
