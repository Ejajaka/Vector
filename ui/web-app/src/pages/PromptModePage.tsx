import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, Copy, Cpu, HelpCircle, Layers, Loader2, Mic, MicOff, Plus, Sparkles, Square, Undo2,
} from 'lucide-react';
import {
  REQUIRED_ATTRS,
  auditElements,
  auditQuality,
  compilePromptScreens,
  layoutElements,
  roughRisk,
  type Clarification,
  type ClarificationOption,
  type CompiledElement,
  type LearnedLexicon,
  type PromptScreen,
  type QualityIssue,
  type Question,
  type Viewport,
} from '../services/promptCompiler.ts';
import { refineWithBERT } from '../services/promptRefiner.ts';
import { loadLearnedLexicon, saveLearnedPhrase } from '../services/lexicon.ts';
import { loadSettings } from '../services/settings.ts';
import { isLLMConfigured } from '../services/llmEngine.ts';
import { parsePromptWithModel, type ModelParseResult } from '../services/semanticParser.ts';
import { transcribeLocally } from '../services/localStt.ts';
import { SideBySideBuild } from '../components/generators/SideBySideBuild.tsx';
import { WireframePreview } from '../components/editor/WireframePreview.tsx';
import type { CanvasItem, CanvasItemType, CanvasPage } from '../data/canvas.ts';
import { TYPE_TO_VARIANT } from '../data/styles.ts';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function speechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
    .SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  return ctor ? new ctor() : null;
}

/** Canvas types that can represent each compiled component kind. */
const CANVAS_TYPE: Partial<Record<CompiledElement['kind'], CanvasItemType>> = {
  navbar: 'navbar',
  heading: 'heading',
  text: 'text',
  button: 'button',
  input: 'input',
  link: 'text',
  card: 'card',
  image: 'image',
  avatar: 'avatar',
  badge: 'badge',
  tabs: 'text',
  progress: 'chart',
  table: 'table',
  chart: 'chart',
  modal: 'modal',
  checkbox: 'input',
  footer: 'footer',
};

/** Convert laid-out prompt screens into real canvas pages. */
function screensToCanvasPages(
  pages: Array<{ screen: PromptScreen; elements: CompiledElement[] }>,
  width: number,
  height: number
): CanvasPage[] {
  return pages.map(({ screen, elements }, index) => {
    const items: CanvasItem[] = [];
    elements.forEach((element) => {
      const type = CANVAS_TYPE[element.kind];
      if (!type) return;
      items.push({
        id: `item_${screen.id}_${element.id}`,
        type,
        variant: TYPE_TO_VARIANT[type],
        x: Math.max(0, Math.round(element.x)),
        y: Math.max(0, Math.round(element.y)),
        w: Math.max(24, Math.round(element.w)),
        h: Math.max(16, Math.round(element.h)),
        label: element.label,
        color: element.colour,
        action: element.action,
        radius: element.radius,
      });
    });
    return {
      id: `page_${screen.id}`,
      name: screen.name || `Page ${index + 1}`,
      width,
      height,
      background: screen.meta.dark ? '#0B0E14' : '#FFFFFF',
      items,
    };
  });
}

interface Props {
  projectId?: string;
  projectName: string;
  onBack: () => void;
  onOpenCanvas: () => void;
  onOpenAssistant?: () => void;
  onRequireUpgrade?: () => void;
}

interface PageRefinement {
  elements: CompiledElement[];
  applied: string[];
  confidence: number;
  ms: number;
}

interface ScreenView {
  screen: PromptScreen;
  elements: CompiledElement[];
  open: Question[];
  risk: number;
  issues: QualityIssue[];
}

const HINTS: Record<string, string> = {
  action: 'Needed so the built UI wires the interaction, not just the label.',
  label: 'Needed so the generator writes real copy instead of a placeholder.',
  colour: 'Needed so the palette is decided, not guessed.',
  location: 'Needed so the element lands in the right region.',
};

const TONE: Record<string, string> = {
  info: 'bg-[var(--v-muted)]',
  merge: 'bg-[#F59E0B]',
  infer: 'bg-[var(--v-teal)]',
  warn: 'bg-[#E5484D]',
};

interface PromptDraft {
  text: string;
  submitted: string;
  answers: Record<string, string>;
  confirmed: Record<string, boolean>;
  activeId: string;
}

function readPromptDraft(projectId?: string): PromptDraft {
  const fallback: PromptDraft = {
    text: '',
    submitted: '',
    answers: {},
    confirmed: {},
    activeId: 'screen_1',
  };
  if (!projectId) return fallback;
  try {
    const raw = localStorage.getItem(`vector_project_prompt_${projectId}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PromptDraft>;
    return {
      text: typeof parsed.text === 'string' ? parsed.text : '',
      submitted: typeof parsed.submitted === 'string' ? parsed.submitted : '',
      answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
      confirmed:
        parsed.confirmed && typeof parsed.confirmed === 'object' ? parsed.confirmed : {},
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : 'screen_1',
    };
  } catch {
    return fallback;
  }
}

const missingAttrs = (element: CompiledElement) =>
  (REQUIRED_ATTRS[element.kind] || []).filter(
    (attribute) => !element[attribute as keyof CompiledElement]
  );

/** Apply confirmed answers, including sibling fills for repeated grids. */
function applyAnswers(
  base: CompiledElement[],
  answers: Record<string, string>,
  confirmed: Record<string, boolean>
): CompiledElement[] {
  const patches = new Map<string, Partial<CompiledElement>>();

  Object.entries(answers).forEach(([key, value]) => {
    if (!confirmed[key] || !value.trim()) return;
    const [id, attribute] = key.split(':');
    const target = base.find((element) => element.id === id);
    if (!target) return;

    base.forEach((element) => {
      const sameElement = element.id === target.id;
      const sibling =
        attribute !== 'location' &&
        element.kind === target.kind &&
        (element.section || '') === (target.section || '') &&
        (element.sourceLine || '') === (target.sourceLine || '') &&
        (element.action || '') === (target.action || '') &&
        !element[attribute as keyof CompiledElement];

      if (!sameElement && !sibling) return;
      const patch = patches.get(element.id) || {};
      (patch as Record<string, string>)[attribute] = value.trim();
      patches.set(element.id, patch);
    });
  });

  return base.map((element) => {
    const patch = patches.get(element.id);
    return patch ? { ...element, ...patch } : element;
  });
}

/**
 * Describe where an element sits on the schematic board without implying that
 * its pixel geometry was specified by the user.
 */
function placementOf(element: CompiledElement, boardWidth: number): string {
  const wide = element.w >= boardWidth * 0.6;
  switch (element.kind) {
    case 'background': return 'full-board backdrop';
    case 'shape': return element.preset === 'shape-divider' ? 'divider line' : 'overlay shape';
    case 'navbar': return 'full width, top';
    case 'footer': return 'full width, bottom';
    case 'modal': return 'centred overlay';
    case 'table':
    case 'chart': return 'full width, data block';
    case 'card': return wide ? 'full-width card' : 'grid cell';
    case 'image': return wide ? 'hero media' : 'media tile';
    case 'input': return 'form column';
    case 'button':
    case 'link':
    case 'badge':
    case 'avatar':
    case 'checkbox': return 'inline action';
    case 'tabs': return 'full width, below header';
    case 'progress': return 'inline progress';
    case 'heading': return 'wide heading';
    case 'text': return 'body copy';
    default: return 'content block';
  }
}

export const PromptModePage: React.FC<Props> = ({
  projectId,
  projectName,
  onBack,
  onOpenCanvas,
  onOpenAssistant,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialDraft = useRef<PromptDraft | null>(null);
  if (initialDraft.current === null) initialDraft.current = readPromptDraft(projectId);

  const [text, setText] = useState(initialDraft.current.text);
  const [submitted, setSubmitted] = useState(initialDraft.current.submitted);
  const [activeId, setActiveId] = useState(initialDraft.current.activeId);
  const [answers, setAnswers] = useState<Record<string, string>>(initialDraft.current.answers);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>(initialDraft.current.confirmed);
  const [copied, setCopied] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [view, setView] = useState<'wireframe' | 'prompt'>('wireframe');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [baselineRisks, setBaselineRisks] = useState<Record<string, number>>({});
  const [lexicon, setLexicon] = useState<LearnedLexicon>(() => loadLearnedLexicon());
  const [model, setModel] = useState<ModelParseResult | null>(null);
  const [modelStatus, setModelStatus] = useState<{ running: boolean; error?: string }>({
    running: false,
  });
  const [refinedById, setRefinedById] = useState<Record<string, PageRefinement | undefined>>({});
  const [deep, setDeep] = useState<{
    running: boolean;
    percent: number;
    stage: string;
    error?: string;
    rejected?: boolean;
  }>({ running: false, percent: 0, stage: '' });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef('');
  const voiceFinalRef = useRef('');
  const shouldListenRef = useRef(false);
  const voiceFailedRef = useRef(false);
  const [voiceSupported] = useState(() => Boolean(speechRecognition()));
  const [listening, setListening] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'requesting' | 'listening' | 'error'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [localVoiceState, setLocalVoiceState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [localVoiceProgress, setLocalVoiceProgress] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const localStopTimerRef = useRef<number | null>(null);

  const stopVoice = () => {
    shouldListenRef.current = false;
    voiceFailedRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setListening(false);
    setVoiceState('idle');
  };

  const startVoice = async () => {
    if (localVoiceState === 'recording') stopLocalVoice();
    if (listening || voiceState === 'requesting') {
      stopVoice();
      return;
    }
    voiceFailedRef.current = false;
    setVoiceError(null);

    const recognition = speechRecognition();
    if (!recognition) {
      setVoiceState('error');
      setVoiceError('Voice input needs Chrome, Edge, or another browser with the Web Speech API.');
      return;
    }

    // Ask for the microphone explicitly first. This produces actionable
    // permission errors and makes the browser prompt appear reliably.
    setVoiceState('requesting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceState('error');
      setVoiceError('This browser cannot access the microphone. Try Chrome or Edge over HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      setVoiceState('error');
      setVoiceError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone permission was blocked. Click the lock icon in the address bar, allow the microphone, and try again.'
          : name === 'NotFoundError'
            ? 'No microphone was found. Connect one and try again.'
            : name === 'NotReadableError'
              ? 'The microphone is busy in another app. Close it and try again.'
              : 'The microphone could not start. Check your system microphone settings.'
      );
      return;
    }

    voiceBaseRef.current = text;
    voiceFinalRef.current = '';
    shouldListenRef.current = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US';
    recognition.onstart = () => {
      setListening(true);
      setVoiceState('listening');
      setVoiceError(null);
    };
    recognition.onresult = (event: any) => {
      setVoiceError(null);
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) voiceFinalRef.current += `${transcript} `;
        else interim += transcript;
      }
      const merged = [voiceBaseRef.current.trim(), voiceFinalRef.current.trim(), interim.trim()]
        .filter(Boolean)
        .join(' ');
      setText(merged);
    };
    recognition.onerror = (event: any) => {
      const code = String(event?.error || 'unknown');
      if (code === 'aborted' && !shouldListenRef.current) return;
      if (code === 'no-speech') {
        // A pause is not a failure. Keep the session alive; onend restarts it.
        setVoiceError('No speech heard yet — keep speaking.');
        return;
      }
      voiceFailedRef.current = true;
      shouldListenRef.current = false;
      setListening(false);
      setVoiceState('error');
      setVoiceError(
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone permission was blocked. Allow it in the browser and try again.'
          : code === 'network'
            ? 'The browser speech service is unreachable. Use On-device voice instead — it records and transcribes on this device.'
            : code === 'audio-capture'
              ? 'No working microphone was found. Check your system input device.'
              : `Voice capture stopped (${code}).`
      );
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setListening(false);
      if (!shouldListenRef.current || voiceFailedRef.current) {
        if (!voiceFailedRef.current) setVoiceState('idle');
        return;
      }
      // Chrome ends a recognition session after a short silence. Restart so the
      // user can keep speaking without pressing the button again.
      window.setTimeout(() => {
        if (!shouldListenRef.current || voiceFailedRef.current) return;
        try {
          recognition.start();
        } catch {
          shouldListenRef.current = false;
          setVoiceState('error');
          setVoiceError('The microphone session ended. Press Speak again to continue.');
        }
      }, 280);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      shouldListenRef.current = false;
      setVoiceState('error');
      setVoiceError('The microphone is already in use. Close the other app and try again.');
    }
  };

  const stopLocalVoice = () => {
    if (localStopTimerRef.current) {
      window.clearTimeout(localStopTimerRef.current);
      localStopTimerRef.current = null;
    }
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {
      // ignore
    }
  };

  const startLocalVoice = async () => {
    if (localVoiceState === 'recording') {
      stopLocalVoice();
      return;
    }
    if (listening || voiceState === 'requesting') stopVoice();
    if (localVoiceState === 'transcribing') return;
    if (typeof MediaRecorder === 'undefined') {
      setVoiceError('This browser cannot record audio. Try Chrome or Edge.');
      return;
    }
    setVoiceError(null);
    setLocalVoiceState('recording');
    setLocalVoiceProgress(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const tracks = mediaStreamRef.current?.getTracks() || [];
        tracks.forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setLocalVoiceState('transcribing');
        setLocalVoiceProgress('Loading the on-device voice model…');
        const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        void transcribeLocally(blob, (progress) => {
          setLocalVoiceProgress(
            progress.percent >= 100
              ? 'Transcribing locally…'
              : `Loading voice model · ${progress.percent}%`
          );
        })
          .then((transcript) => {
            const clean = transcript.trim();
            if (!clean) {
              setVoiceError('No speech was detected in the recording. Try again and speak a little longer.');
              return;
            }
            setText((previous) => [previous.trim(), clean].filter(Boolean).join(' '));
            setVoiceError(null);
          })
          .catch((error) => {
            setVoiceError(
              `On-device voice failed: ${
                error instanceof Error ? error.message : 'the model could not load.'
              }`
            );
          })
          .finally(() => {
            setLocalVoiceState('idle');
            setLocalVoiceProgress(null);
          });
      };
      recorder.start(250);
      // Safety stop so a forgotten recording cannot grow forever.
      localStopTimerRef.current = window.setTimeout(() => stopLocalVoice(), 60_000);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      setLocalVoiceState('idle');
      setVoiceError(
        name === 'NotAllowedError'
          ? 'Microphone permission was blocked. Allow the microphone and try again.'
          : 'The microphone could not start for the on-device recorder.'
      );
    }
  };

  useEffect(
    () => () => {
      shouldListenRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      if (localStopTimerRef.current) window.clearTimeout(localStopTimerRef.current);
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  useEffect(() => {
    if (!projectId) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          `vector_project_prompt_${projectId}`,
          JSON.stringify({ text, submitted, answers, confirmed, activeId })
        );
      } catch {
        // ignore quota/private-mode errors
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [projectId, text, submitted, answers, confirmed, activeId]);

  const deterministicScreens = useMemo(
    () => compilePromptScreens(submitted, lexicon),
    [submitted, lexicon]
  );
  const screens = model?.screens ?? deterministicScreens;
  const modelSettings = loadSettings();
  const modelReady = isLLMConfigured(modelSettings);
  const pageIndex = Math.max(0, screens.findIndex((screen) => screen.id === activeId));
  const compiled = screens[pageIndex] ?? screens[0];

  const refined = refinedById[compiled.id];
  const baseElements = refined?.elements ?? compiled.elements;
  const merged = useMemo(
    () => applyAnswers(baseElements, answers, confirmed),
    [baseElements, answers, confirmed]
  );
  const open = useMemo(() => auditElements(merged), [merged]);
  const elements = useMemo(
    () => layoutElements(merged, compiled.archetype, viewport, compiled.meta.tokens),
    [merged, compiled.archetype, compiled.meta.tokens, viewport]
  );
  const issues = useMemo(() => auditQuality(elements), [elements]);
  const risk = roughRisk(elements);
  const baselineRisk = baselineRisks[compiled.id] ?? null;
  const answeredCount = Object.values(confirmed).filter(Boolean).length;

  const allScreens: ScreenView[] = useMemo(
    () =>
      screens.map((screen) => {
        const pageBase = refinedById[screen.id]?.elements ?? screen.elements;
        const pageMerged = applyAnswers(pageBase, answers, confirmed);
        const pageLayout = layoutElements(
          pageMerged,
          screen.archetype,
          viewport,
          screen.meta.tokens
        );
        return {
          screen,
          elements: pageLayout,
          open: auditElements(pageMerged),
          risk: roughRisk(pageLayout),
          issues: auditQuality(pageLayout),
        };
      }),
    [screens, refinedById, answers, confirmed, viewport]
  );

  const totalOpen = allScreens.reduce((sum, page) => sum + page.open.length, 0);
  const overallRisk = allScreens.reduce((max, page) => Math.max(max, page.risk), 0);
  const unrecognised = allScreens.filter(
    (page) =>
      page.screen.meta.usedLines === 0 &&
      page.screen.meta.specLines > 0 &&
      page.screen.clarifications.length === 0
  );
  const pendingClarifications = allScreens.reduce(
    (sum, page) => sum + page.screen.clarifications.length,
    0
  );
  const modelHasWarnings = Boolean(model && model.warnings.length > 0);
  const ready =
    submitted.trim().length > 0 &&
    totalOpen === 0 &&
    unrecognised.length === 0 &&
    pendingClarifications === 0 &&
    !modelHasWarnings;
  const pageReady =
    submitted.trim().length > 0 &&
    open.length === 0 &&
    elements.length > 0 &&
    compiled.clarifications.length === 0 &&
    !modelHasWarnings;

  const confidence = elements.length
    ? Math.round(
        (elements.reduce((sum, element) => sum + (element.confidence || 0), 0) / elements.length) * 100
      )
    : 0;

  const missingCount = elements.reduce((sum, element) => sum + missingAttrs(element).length, 0);
  const requiredCount = elements.reduce(
    (sum, element) => sum + (REQUIRED_ATTRS[element.kind]?.length || 0),
    0
  );

  const boardWidth = viewport === 'mobile' ? 390 : 1200;
  const boardHeight = viewport === 'mobile' ? 844 : 800;

  const revisedPrompt = useMemo(() => {
    if (!submitted.trim()) return '';
    const tokens = screens[0]?.meta.tokens ?? compiled.meta.tokens;
    const multi = screens.length > 1;
    const lines: string[] = [
      'ROLE',
      'You are a senior product designer and front-end engineer.',
      '',
      'TASK',
      submitted.trim(),
      '',
      'SCREENS',
      ...screens.map((screen, index) => `${index + 1}. ${screen.name} — ${screen.archetype}`),
      '',
      'DESIGN TOKENS',
      `primary ${tokens.primary}${tokens.statedColour ? '' : ' (house default)'}`,
      `theme ${tokens.theme}`,
      `density ${tokens.density}`,
      `radius ${tokens.radius}px`,
      `typeface ${tokens.font}`,
      '',
      'LAYOUT',
      `Schematic ${boardWidth}×${boardHeight} ${viewport} board. Positions are a starting skeleton, not fixed CSS or a measurement taken from the request. Use responsive auto-layout.`,
      '',
    ];

    const writePage = (page: ScreenView) => {
      if (!page.elements.length) {
        lines.push('(no recognised components — this page reads as a drawing or visual instruction, not UI)');
        lines.push('');
        return;
      }

      page.elements.forEach((element, index) => {
        const attrs = [
          element.label ? `label “${element.label}”` : 'label UNRESOLVED',
          element.count && element.count > 1 ? `×${element.count}` : '',
          element.colour ? `colour ${element.colour}${element.colourInferred ? ' (derived)' : ''}` : '',
          element.colour2 ? `second colour ${element.colour2}` : '',
          element.action ? `action ${element.action}` : '',
          element.section ? `section “${element.section}”` : '',
          `place ${placementOf(element, boardWidth)}`,
        ].filter(Boolean);
        lines.push(`${index + 1}. ${element.kind} — ${attrs.join(', ')}.`);
      });
      lines.push('');
    };

    if (!multi) {
      lines.push('ELEMENTS');
      writePage(allScreens[0]);
    } else {
      allScreens.forEach((page, index) => {
        lines.push(`ELEMENTS — Page ${index + 1}: ${page.screen.name}`);
        writePage(page);
      });
    }

    const audit = Array.from(
      new Set(allScreens.flatMap((page) => page.issues.map((issue) => issue.text)))
    );
    if (audit.length) {
      lines.push('AUDIT');
      audit.slice(0, 8).forEach((text) => lines.push(`- ${text}`));
      lines.push('');
    }

    lines.push('CONSTRAINTS');
    lines.push('- Responsive; single column below 768px. WCAG AA contrast, visible focus states.');
    lines.push('- Real copy, designed empty, loading and error states. Do not invent extra sections.');
    if (allScreens.some((page) => page.screen.meta.dark)) {
      lines.push('- Dark theme: dark surfaces with accessible light text.');
    }
    if (multi) lines.push(`- Build ${screens.length} screens as one flow; keep navigation labels consistent between pages.`);
    return lines.join('\n');
  }, [
    submitted, screens, allScreens, compiled.meta.tokens, viewport, boardWidth, boardHeight,
  ]);

  // Keep the exact revised prompt in the project folder so the studio can use
  // it as an Analysis prompt version without copying or recompiling.
  useEffect(() => {
    if (!projectId) return;
    const key = `vector_project_revised_prompt_${projectId}`;
    try {
      if (!submitted.trim() || !revisedPrompt.trim()) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(
        key,
        JSON.stringify({
          prompt: revisedPrompt,
          updatedAt: new Date().toISOString(),
          risk,
          elements: elements.length,
          pages: screens.length,
        })
      );
    } catch {
      // storage is best effort
    }
  }, [projectId, submitted, revisedPrompt, risk, elements.length, screens.length]);

  const suggestions = useMemo(() => {
    if (!submitted.trim()) return [];
    const found: string[] = [];
    const unlabelled = merged.filter(
      (element) => !element.label && (REQUIRED_ATTRS[element.kind] || []).includes('label')
    ).length;

    if (compiled.clarifications.length > 0) {
      found.push(
        `Clarify ${compiled.clarifications.length} unmapped word${compiled.clarifications.length === 1 ? '' : 's'} to draw this page.`
      );
    } else if (compiled.meta.usedLines === 0 && compiled.meta.specLines > 0) {
      found.push('This page has no screenshot-able components — describe UI elements, not a drawing.');
    }
    if (unlabelled > 0) {
      found.push(
        `${unlabelled} element${unlabelled === 1 ? '' : 's'} still need${unlabelled === 1 ? 's' : ''} real copy.`
      );
    }
    if (!compiled.meta.tokens.statedColour) {
      found.push('No primary colour stated — accents use the house violet. Name one for a real palette.');
    }
    if (!compiled.meta.tokens.responsive) {
      found.push('Responsive behaviour not stated — the board shows one breakpoint.');
    }
    if (issues.length > 0) {
      found.push(`${issues.length} design issue${issues.length === 1 ? '' : 's'}: ${issues[0].text}`);
    }
    if (!compiled.meta.structured && submitted.trim().split(/\s+/).length > 45) {
      found.push('Long prose — split the spec into sections so no line is skipped.');
    }
    if (screens.length > 1 && totalOpen > 0) {
      found.push(`${totalOpen} gap${totalOpen === 1 ? '' : 's'} remain across ${screens.length} pages.`);
    }
    return found.slice(0, 4);
  }, [submitted, merged, compiled.meta, issues, screens.length, totalOpen]);

  /**
   * Append a new screen block. The marker keeps the source readable and gives
   * the page a name; the user only has to write the components underneath.
   */
  const addScreen = () => {
    const separators = (text.match(/^-{3,}\s*$/gm) || []).length;
    const named = (text.match(/^(?:#{1,6}\s*)?(?:screen|page|view|step)\s*\d*/gim) || []).length;
    const hasContent = text.trim().length > 0;
    const existingPages = Math.max(separators, named) || (hasContent ? 1 : 0);
    const next = existingPages + 1;
    const prefix = hasContent ? `${text.trimEnd()}\n\n` : '';
    setText(`${prefix}---\nScreen ${next}: `);
    requestAnimationFrame(() => {
      const field = textareaRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
  };

  const analyse = () => {
    const next = compilePromptScreens(text);
    const baselines: Record<string, number> = {};
    next.forEach((screen) => {
      baselines[screen.id] = roughRisk(
        layoutElements(screen.elements, screen.archetype, 'desktop', screen.meta.tokens)
      );
    });
    setSubmitted(text);
    setAnswers({});
    setConfirmed({});
    setBaselineRisks(baselines);
    setRefinedById({});
    setModel(null);
    setModelStatus({ running: false });
    setDeep({ running: false, percent: 0, stage: '' });
    setActiveId(next[0]?.id ?? 'screen_1');
    setView('wireframe');
  };

  const answer = (id: string) => {
    if ((answers[id] || '').trim().length < 2) return;
    setConfirmed((previous) => ({ ...previous, [id]: true }));
  };

  const answerWith = (id: string, value: string) => {
    setAnswers((previous) => ({ ...previous, [id]: value }));
    setConfirmed((previous) => ({ ...previous, [id]: true }));
  };

  /**
   * Learn a word from a choice, then recompile. This is how the engine grows
   * without a training job: the workspace remembers its own vocabulary.
   */
  const chooseClarification = (
    clarification: Clarification,
    option: ClarificationOption
  ) => {
    const next = saveLearnedPhrase(clarification.phrase, option.kind ?? 'ignore');
    setLexicon(next);
    setModel(null);
    setModelStatus({ running: false });
    setAnswers({});
    setConfirmed({});
    setRefinedById({});
    setBaselineRisks({});
  };

  const runDeepPass = async () => {
    if (!submitted.trim() || deep.running) return;
    const screenId = compiled.id;
    const screenName = compiled.name;
    setDeep({ running: true, percent: 0, stage: `Starting the local model for ${screenName}` });
    try {
      const outcome = await refineWithBERT(compiled, (progress) =>
        setDeep({ running: true, percent: progress.percent, stage: progress.stage })
      );
      const span = `${outcome.lines} lines · ${Math.round(outcome.confidence * 100)}% span confidence · ${outcome.ms}ms`;

      if (outcome.rejected) {
        setRefinedById((previous) => ({ ...previous, [screenId]: undefined }));
        setDeep({
          running: false,
          percent: 100,
          rejected: true,
          stage: `Rejected on ${screenName} — the model would raise risk ${outcome.beforeRisk} → ${outcome.afterRisk}. Deterministic result kept. ${span}`,
        });
        return;
      }

      if (!outcome.applied.length) {
        setRefinedById((previous) => ({ ...previous, [screenId]: undefined }));
        setDeep({
          running: false,
          percent: 100,
          stage: `No grounded fixes found on ${screenName}. Deterministic result kept. ${span}`,
        });
        return;
      }

      setRefinedById((previous) => ({
        ...previous,
        [screenId]: {
          elements: outcome.elements,
          applied: outcome.applied,
          confidence: outcome.confidence,
          ms: outcome.ms,
        },
      }));
      setDeep({
        running: false,
        percent: 100,
        stage: `${outcome.applied.length} fix${outcome.applied.length === 1 ? '' : 'es'} on ${screenName} · ${span}`,
      });
    } catch (error) {
      setDeep({
        running: false,
        percent: 0,
        stage: '',
        error: error instanceof Error ? error.message : 'The local model is unavailable — the deterministic result is kept.',
      });
    }
  };

  /**
   * Use a strong hosted model to propose the schema, then let the deterministic
   * compiler validate, lay out and score it. No pixels come from the model.
   */
  const runModelParse = async () => {
    if (!submitted.trim() || modelStatus.running) return;
    if (!modelReady) {
      onOpenAssistant?.();
      return;
    }

    setModelStatus({ running: true });
    try {
      // Compare against the deterministic artifact *including* the user's
      // confirmed answers, otherwise the model's risk looks better than it is.
      const answeredBase = deterministicScreens.map((screen) => {
        const answered = applyAnswers(screen.elements, answers, confirmed);
        return { ...screen, elements: answered, questions: auditElements(answered) };
      });
      const result = await parsePromptWithModel(submitted, lexicon, answeredBase);
      setModel(result);
      // Keep deterministic answers: model ids are namespaced, so they cannot
      // collide, and switching back must not erase the user's work.
      setRefinedById({});
      setBaselineRisks({});
      setActiveId(result.screens[0]?.id ?? 'screen_1');
      setModelStatus({ running: false });
    } catch (error) {
      setModelStatus({
        running: false,
        error: error instanceof Error ? error.message : 'The model parse failed.',
      });
    }
  };

  const useDeterministic = () => {
    setModel(null);
    setModelStatus({ running: false });
    setRefinedById({});
    setBaselineRisks({});
  };

  /**
   * Open the freeform canvas. On the first visit, seed it with the compiled
   * screens so the two modes show the same artifact instead of a blank board.
   * Never overwrite an existing canvas.
   */
  const openCanvas = () => {
    const docKey = projectId ? `vector_project_doc_${projectId}` : null;
    if (docKey && submitted.trim() && screens.length > 0) {
      try {
        const raw = localStorage.getItem(docKey);
        const parsed = raw ? JSON.parse(raw) : null;
        const pages: CanvasPage[] = Array.isArray(parsed?.pages) ? parsed.pages : [];
        const blank = pages.length === 0 || pages.every((page) => !Array.isArray(page.items) || page.items.length === 0);
        if (blank) {
          localStorage.setItem(
            docKey,
            JSON.stringify({
              name: projectName,
              pages: screensToCanvasPages(
                allScreens.map((view) => ({ screen: view.screen, elements: view.elements })),
                boardWidth,
                boardHeight
              ),
              updatedAt: new Date().toISOString(),
            })
          );
        }
      } catch {
        // A malformed or full store must not block the canvas.
      }
    }
    onOpenCanvas();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(revisedPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-4 v-fade-up">
      <header className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} className="v-icon-btn -ml-1" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[16px] font-bold text-[var(--v-ink)]">{projectName}</h1>
          <p className="text-[10.5px] text-[var(--v-faint)]">
            Prompt mode · deterministic engine · {screens.length > 1 ? `${screens.length} pages · ` : ''}optional local model
          </p>
        </div>
        <button type="button" onClick={openCanvas} className="ml-auto v-btn v-btn-ghost h-8 px-3 text-[11px]">
          <Layers className="w-3 h-3" /> Switch to canvas
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------ prompt + engine */}
        <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
          <div className="block">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">Describe the screen</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={listening || voiceState === 'requesting' ? stopVoice : () => void startVoice()}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold transition-colors ${
                    voiceState === 'requesting'
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#9A6700]'
                      : listening
                        ? 'border-[#FF7A59] bg-[#FF7A59]/10 text-[#C2410C]'
                        : 'border-[var(--v-line)] bg-[var(--v-surface)] text-[var(--v-muted)] hover:border-[var(--v-violet)] hover:text-[var(--v-violet)]'
                  }`}
                  aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                  title={voiceSupported ? 'Capture speech with the browser speech service' : 'Browser speech capture needs Chrome or Edge'}
                >
                  {voiceState === 'requesting' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : listening ? (
                    <MicOff className="h-3.5 w-3.5" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                  {voiceState === 'requesting' ? 'Allow microphone…' : listening ? 'Stop listening' : 'Speak instead'}
                </button>
                <button
                  type="button"
                  onClick={localVoiceState === 'recording' ? stopLocalVoice : () => void startLocalVoice()}
                  disabled={localVoiceState === 'transcribing'}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold transition-colors ${
                    localVoiceState === 'recording'
                      ? 'border-[#FF7A59] bg-[#FF7A59]/10 text-[#C2410C]'
                      : 'border-[var(--v-line)] bg-[var(--v-surface)] text-[var(--v-muted)] hover:border-[var(--v-teal)] hover:text-[var(--v-teal)] disabled:opacity-50'
                  }`}
                  title="Record and transcribe on this device — no browser speech service needed"
                  aria-label={localVoiceState === 'recording' ? 'Stop local recording' : 'Start on-device voice capture'}
                >
                  {localVoiceState === 'recording' ? (
                    <Square className="h-3 w-3 fill-current" />
                  ) : localVoiceState === 'transcribing' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Cpu className="h-3.5 w-3.5" />
                  )}
                  {localVoiceState === 'recording'
                    ? 'Stop & transcribe'
                    : localVoiceState === 'transcribing'
                      ? 'Transcribing…'
                      : 'On-device'}
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              placeholder={'Login page with a blue button saying "Continue", email and password fields, and a logo at the top.'}
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--v-ink)] outline-none focus:border-[var(--v-violet)]"
            />
            {voiceState === 'requesting' && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#9A6700]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Waiting for microphone permission… choose Allow in the browser prompt.
              </p>
            )}
            {listening && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#C2410C]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF7A59]" />
                Listening… speak naturally. The transcript appears above.
              </p>
            )}
            {localVoiceState === 'recording' && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#C2410C]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF7A59]" />
                Recording on this device… tap Stop &amp; transcribe when finished.
              </p>
            )}
            {localVoiceState === 'transcribing' && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[var(--v-muted)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                {localVoiceProgress || 'Transcribing on this device…'}
              </p>
            )}
            {voiceError && <p className="mt-1 text-[10px] font-medium text-[#B94D42]">{voiceError}</p>}
            {!voiceSupported && !voiceError && (
              <p className="mt-1 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                Browser speech capture needs Chrome or Edge. Use <b>On-device</b> to record and transcribe locally.
              </p>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[9.5px] text-[var(--v-faint)]">
              Pages split on <code className="font-semibold">---</code> or{' '}
              <code className="font-semibold">Screen 2: Dashboard</code>. Name the screen, press Enter, then describe it.
            </span>
            <button
              type="button"
              onClick={addScreen}
              className="flex h-6 items-center gap-1 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] px-2 text-[9.5px] font-bold text-[var(--v-muted)] hover:border-[var(--v-violet)] hover:text-[var(--v-violet)]"
            >
              <Plus className="h-3 w-3" /> Add screen
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={analyse} className="v-btn v-btn-primary h-9 px-4 text-[11.5px]">
              <Sparkles className="w-3.5 h-3.5" /> Analyse prompt
            </button>
            {submitted && (
              <span className="text-[10.5px] text-[var(--v-muted)]">
                {screens.length > 1 ? `${screens.length} pages · ` : ''}
                {elements.length} elements · risk {risk} · {open.length} open · {confidence}% confidence
              </span>
            )}
          </div>

          {/* ------------------------------------------------ engine output */}
          {submitted && (
            <div className="mt-3 rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">
                  Analysis{screens.length > 1 ? ` · page ${pageIndex + 1} of ${screens.length}` : ''}
                </p>
                <div className="flex items-center gap-1">
                  {model && (
                    <span className="rounded-full bg-[var(--v-violet)]/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--v-violet)]">
                      Model
                    </span>
                  )}
                  <span className="text-[9.5px] text-[var(--v-faint)]">
                    {compiled.name} · {compiled.archetype} · risk {risk}
                    {screens.length > 1 ? ` · overall ${overallRisk}` : ''}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--v-muted)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: compiled.meta.tokens.primary }} />
                  {compiled.meta.tokens.primary}
                  {!compiled.meta.tokens.statedColour && ' (house)'}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  {compiled.meta.tokens.theme}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  {compiled.meta.tokens.density}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  radius {compiled.meta.tokens.radius}
                </span>
                <span className="rounded-full bg-[var(--v-surface)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--v-muted)]">
                  {compiled.meta.tokens.font}
                </span>
              </div>

              <ul className="mt-2 space-y-1">
                {compiled.meta.signals.map((signal) => (
                  <li key={signal.text} className="flex gap-1.5 text-[10px] leading-relaxed text-[var(--v-muted)]">
                    <span className={`mt-[5px] h-1 w-1 shrink-0 rounded-full ${TONE[signal.tone] || TONE.info}`} />
                    {signal.text}
                  </li>
                ))}
              </ul>

              {/* ------------------------------------------------ model pass */}
              <div className="mt-2.5 rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={runDeepPass}
                    disabled={deep.running || elements.length === 0}
                    className="flex h-7 items-center gap-1.5 rounded-lg bg-[var(--v-ink)] px-2.5 text-[10px] font-bold text-[var(--v-surface)] disabled:opacity-50"
                  >
                    {deep.running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Cpu className="h-3 w-3" />}
                    {refined ? 'Re-run deep pass' : 'Deep pass (local BERT)'}
                  </button>
                  {refined && !deep.running && (
                    <button
                      type="button"
                      onClick={() => {
                        setRefinedById((previous) => ({ ...previous, [compiled.id]: undefined }));
                        setDeep({ running: false, percent: 0, stage: '' });
                      }}
                      className="flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                    >
                      <Undo2 className="h-3 w-3" /> Undo
                    </button>
                  )}
                  <span className="text-[9px] text-[var(--v-faint)]">
                    Runs on your machine and is cached after first use. A pass that raises risk is rejected.
                  </span>
                </div>

                {deep.running && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--v-line)]">
                      <div
                        className="h-full rounded-full bg-[var(--v-violet)] transition-all"
                        style={{ width: `${deep.percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[9px] text-[var(--v-muted)]">{deep.stage}</p>
                  </div>
                )}

                {!deep.running && deep.stage && (
                  <p
                    className="mt-1 text-[9px]"
                    style={{ color: deep.rejected ? '#B45309' : 'var(--v-muted)' }}
                  >
                    {deep.stage}
                  </p>
                )}
                {!deep.running && refined && refined.applied.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {refined.applied.slice(0, 4).map((entry) => (
                      <li key={entry} className="text-[9px] text-[var(--v-muted)]">• {entry}</li>
                    ))}
                  </ul>
                )}
                {deep.error && (
                  <p className="mt-1 text-[9px] text-[#B94D42]">{deep.error}</p>
                )}
              </div>

              {/* ------------------------------------------------ model parse */}
              <div className="mt-2 rounded-lg border border-[var(--v-violet)]/30 bg-[var(--v-surface)] p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={runModelParse}
                    disabled={modelStatus.running}
                    className="flex h-7 items-center gap-1.5 rounded-lg bg-[var(--v-violet)] px-2.5 text-[10px] font-bold text-white disabled:opacity-50"
                  >
                    {modelStatus.running ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {modelReady ? (model ? 'Re-run AI parse' : 'AI parse') : 'Connect model'}
                  </button>
                  {model && !modelStatus.running && (
                    <button
                      type="button"
                      onClick={useDeterministic}
                      className="flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                    >
                      <Undo2 className="h-3 w-3" /> Use deterministic
                    </button>
                  )}
                  <span className="text-[9px] text-[var(--v-faint)]">
                    {modelReady
                      ? `${modelSettings.model} · schema validated locally`
                      : 'A strong model proposes the schema; the compiler draws it.'}
                  </span>
                </div>

                {modelStatus.running && (
                  <p className="mt-1 text-[9px] text-[var(--v-muted)]">
                    Parsing with the model and validating the schema…
                  </p>
                )}
                {!modelStatus.running && model && (
                  <p className="mt-1 text-[9px] text-[var(--v-muted)]">
                    {model.model} · {model.screens.length} screen
                    {model.screens.length === 1 ? '' : 's'} · {model.ms}ms · risk {model.modelRisk} vs
                    deterministic {model.deterministicRisk}
                  </p>
                )}
                {!modelStatus.running &&
                  model?.warnings.slice(0, 2).map((warning) => (
                    <p key={warning} className="mt-0.5 text-[9px] leading-relaxed text-[#B45309]">
                      {warning}
                    </p>
                  ))}
                {!modelReady && (
                  <p className="mt-1 text-[9px] leading-relaxed text-[var(--v-faint)]">
                    Add an OpenAI-compatible key or proxy in the assistant. For production, point the
                    base URL at your own proxy so keys never reach the browser.
                  </p>
                )}
                {modelStatus.error && (
                  <p className="mt-1 text-[9px] leading-relaxed text-[#B94D42]">
                    {modelStatus.error}
                  </p>
                )}
              </div>

              {/* ------------------------------------------------ components */}
              <p className="mt-2.5 text-[9px] font-bold uppercase tracking-wider text-[var(--v-faint)]">Components</p>
              <div className="mt-1 max-h-[200px] space-y-1 overflow-auto v-scroll pr-1">
                {elements.map((element) => {
                  const missing = missingAttrs(element);
                  return (
                    <div key={element.id} className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="rounded bg-[var(--v-surface)] px-1.5 py-0.5 font-bold uppercase tracking-wider text-[var(--v-muted)]">
                        {element.kind}
                      </span>
                      <span className="font-semibold text-[var(--v-ink)]">
                        {element.label ||
                          ((REQUIRED_ATTRS[element.kind] || []).includes('label') ? (
                            <span className="italic text-[var(--v-faint)]">needs copy</span>
                          ) : (
                            <span className="text-[var(--v-faint)]">—</span>
                          ))}
                      </span>
                      {element.section && (
                        <span className="text-[9px] text-[var(--v-faint)]">@{element.section}</span>
                      )}
                      {element.mentions && element.mentions > 1 && (
                        <span className="rounded-full bg-[var(--v-surface)] px-1 text-[9px] font-bold text-[var(--v-muted)]">
                          ×{element.mentions}
                        </span>
                      )}
                      {element.colour && (
                        <span
                          className="rounded px-1 py-0.5 text-[9px]"
                          style={{ background: `${element.colour}22`, color: element.colour }}
                        >
                          {element.colour}
                          {element.colourInferred ? ' ·' : ''}
                        </span>
                      )}
                      {element.colour2 && (
                        <span
                          className="rounded px-1 py-0.5 text-[9px]"
                          style={{ background: `${element.colour2}22`, color: element.colour2 }}
                        >
                          {element.colour2}
                        </span>
                      )}
                      {element.action && (
                        <span className="text-[9px] text-[var(--v-muted)]">→ {element.action}</span>
                      )}
                      <span className="text-[9px] text-[var(--v-faint)]">
                        {Math.round((element.confidence || 0) * 100)}%
                      </span>
                      {missing.length > 0 && (
                        <span className="text-[9px] font-semibold text-[#B94D42]">missing {missing.join(', ')}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {issues.length > 0 && (
                <div className="mt-2 rounded-lg bg-[var(--v-surface)] p-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#B94D42]">
                    Design audit · {issues.length}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {issues.slice(0, 4).map((issue) => (
                      <li key={issue.text} className="text-[9.5px] leading-relaxed text-[var(--v-muted)]">• {issue.text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {elements.length === 0 ? (
                <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                  {compiled.clarifications.length > 0
                    ? `Clarify ${compiled.clarifications.length} word${compiled.clarifications.length === 1 ? '' : 's'} to draw this page.`
                    : `No components to score on this page. ${compiled.meta.specLines} line${
                        compiled.meta.specLines === 1 ? '' : 's'
                      } ${compiled.meta.specLines === 1 ? 'was' : 'were'} read, but none described a UI component.`}
                </p>
              ) : (
                <p className="mt-2 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                  Risk {risk}: {missingCount} unresolved attribute{missingCount === 1 ? '' : 's'} of {requiredCount}{' '}
                  required, plus {issues.length} design issue{issues.length === 1 ? '' : 's'}. Dashed red boxes are the
                  same gaps. Geometry is a schematic default, not a measurement of your request.
                </p>
              )}
            </div>
          )}

          {/* ------------------------------------------ unmapped vocabulary */}
          {submitted && compiled.clarifications.length > 0 && (
            <div className="mt-3 rounded-xl border border-[#F59E0B]/40 bg-[var(--v-surface-2)] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-ink)]">
                <HelpCircle className="h-3.5 w-3.5 text-[#B45309]" />
                Clarify before drawing
              </p>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-[var(--v-faint)]">
                Only decisions that change the wireframe. Your answer is remembered for this workspace.
              </p>
              <div className="mt-2 space-y-2">
                {compiled.clarifications.map((clarification) => (
                  <div key={clarification.id}>
                    <p className="text-[10.5px] text-[var(--v-muted)]">{clarification.text}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {clarification.options.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => chooseClarification(clarification, option)}
                          className="rounded-full border border-[var(--v-line)] bg-[var(--v-surface)] px-2 py-0.5 text-[9.5px] font-semibold text-[var(--v-violet)] hover:border-[var(--v-violet)]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -------------------------------------------- clarification list */}
          {submitted && open.length > 0 && (
            <div className="mt-3 rounded-xl border border-[var(--v-violet)]/40 bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-ink)]">
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--v-violet)]" />
                  {open.length} open question{open.length === 1 ? '' : 's'}
                  {screens.length > 1 ? ` on ${compiled.name}` : ''}
                </p>
                <span className="text-[9.5px] text-[var(--v-faint)]">
                  {totalOpen} across all pages · answer → re-runs
                </span>
              </div>

              <div className="mt-2 max-h-[300px] space-y-2.5 overflow-auto v-scroll pr-1">
                {open.map((question) => (
                  <div key={question.id}>
                    <label className="block text-[10.5px] text-[var(--v-muted)]">{question.text}</label>
                    {question.suggestion && (
                      <button
                        type="button"
                        onClick={() => answerWith(question.id, question.suggestion as string)}
                        className="mt-1 rounded-full border border-[var(--v-line)] bg-[var(--v-surface)] px-2 py-0.5 text-[9.5px] font-semibold text-[var(--v-violet)] hover:border-[var(--v-violet)]"
                      >
                        Use “{question.suggestion}”
                      </button>
                    )}
                    <div className="mt-1 flex gap-1.5">
                      <input
                        value={answers[question.id] || ''}
                        onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            answer(question.id);
                          }
                        }}
                        placeholder="Type your answer, then press Enter"
                        className="v-input h-8 flex-1 px-2.5 text-[11.5px]"
                      />
                      <button
                        type="button"
                        disabled={(answers[question.id] || '').trim().length < 2}
                        onClick={() => answer(question.id)}
                        className="h-8 rounded-lg bg-[var(--v-ink)] px-2.5 text-[10.5px] font-bold text-[var(--v-surface)] disabled:opacity-30"
                      >
                        Answer
                      </button>
                    </div>
                    <p className="mt-0.5 text-[9.5px] text-[var(--v-faint)]">
                      {HINTS[question.attribute] || HINTS.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --------------------------------------------------- re-analysis */}
          {submitted && (answeredCount > 0 || refined) && baselineRisk !== null && (
            <div className="mt-3 rounded-xl border border-[var(--v-teal)]/40 bg-[var(--v-surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--v-ink)]">
                  <Check className="h-3.5 w-3.5 text-[var(--v-teal)]" />
                  {answeredCount > 0
                    ? `Re-analysed after ${answeredCount} answer${answeredCount === 1 ? '' : 's'}${refined ? ' + model pass' : ''}`
                    : 'Re-analysed after the model pass'}
                  {screens.length > 1 ? ` · ${compiled.name}` : ''}
                </p>
                <span className="text-[9.5px] font-semibold text-[var(--v-teal)]">
                  risk {baselineRisk} → {risk}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-[var(--v-muted)]">
                {elements.length} element{elements.length === 1 ? '' : 's'} · {open.length} open ·{' '}
                {confidence}% confidence · {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
              </p>
              {suggestions.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion} className="flex gap-1.5 text-[10px] leading-relaxed text-[var(--v-muted)]">
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[var(--v-violet)]" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {submitted && ready && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--v-teal)]">
              <Check className="h-3.5 w-3.5" /> No gaps left — every page is complete.
            </p>
          )}

          {submitted && !ready && pageReady && totalOpen > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--v-teal)]">
              <Check className="h-3.5 w-3.5" /> {compiled.name} is complete — {totalOpen} gap
              {totalOpen === 1 ? '' : 's'} remain on other pages.
            </p>
          )}

          {submitted && unrecognised.length > 0 && (
            <p className="mt-3 flex gap-1.5 text-[10.5px] font-semibold leading-relaxed text-[#B45309]">
              <AlertCircle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
              {unrecognised.length === 1
                ? `“${unrecognised[0].screen.name}” has no recognised UI components — it reads like a drawing, not a screen spec.`
                : `${unrecognised.length} pages have no recognised UI components.`}
            </p>
          )}
        </section>

        {/* ------------------------------------------------ artifact preview */}
        <section className="rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-full bg-[var(--v-surface-2)] p-0.5">
              {(['wireframe', 'prompt'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-full px-2.5 py-1 text-[9.5px] font-bold capitalize ${
                    view === option ? 'bg-[var(--v-ink)] text-[var(--v-surface)]' : 'text-[var(--v-muted)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {view === 'wireframe' && (
              <div className="flex rounded-full bg-[var(--v-surface-2)] p-0.5">
                {(['desktop', 'mobile'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setViewport(option)}
                    className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${
                      viewport === option ? 'bg-[var(--v-ink)] text-[var(--v-surface)]' : 'text-[var(--v-muted)]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            <span className="text-[10px] text-[var(--v-faint)]">
              {submitted
                ? `${compiled.archetype} · ${elements.length} el · risk ${risk}${screens.length > 1 ? ` · overall ${overallRisk}` : ''}`
                : 'waiting for a prompt'}
            </span>
          </div>

          {screens.length > 1 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {screens.map((screen, index) => {
                const pageView = allScreens[index];
                const active = screen.id === compiled.id;
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setActiveId(screen.id)}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-semibold ${
                      active
                        ? 'bg-[var(--v-ink)] text-[var(--v-surface)]'
                        : 'bg-[var(--v-surface-2)] text-[var(--v-muted)] hover:text-[var(--v-ink)]'
                    }`}
                  >
                    <span className={active ? 'opacity-70' : 'opacity-60'}>{index + 1}</span>
                    {screen.name}
                    {pageView && pageView.open.length > 0 && (
                      <span className={`rounded-full px-1 text-[8px] ${active ? 'bg-white/20' : 'bg-[var(--v-surface)]'}`}>
                        {pageView.open.length}
                      </span>
                    )}
                    {pageView && pageView.screen.clarifications.length > 0 && (
                      <span
                        className={`rounded-full px-1 text-[8px] font-bold ${
                          active ? 'bg-white/20' : 'bg-[#F59E0B]/10 text-[#B45309]'
                        }`}
                      >
                        ?
                      </span>
                    )}
                    {pageView &&
                      pageView.screen.meta.usedLines === 0 &&
                      pageView.screen.meta.specLines > 0 && (
                        <span
                          className={`rounded-full px-1 text-[8px] font-bold ${
                            active ? 'bg-white/20' : 'bg-[#B45309]/10 text-[#B45309]'
                          }`}
                        >
                          !
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          )}

          {view === 'wireframe' ? (
            <>
              <div className="mt-2 rounded-xl bg-[var(--v-surface-2)] p-3">
                <WireframePreview
                  elements={elements}
                  dark={compiled.meta.dark}
                  width={boardWidth}
                  height={boardHeight}
                  empty={
                    submitted && compiled.clarifications.length > 0 ? (
                      <div className="px-4 text-center">
                        <p className={`text-[11px] font-bold ${compiled.meta.dark ? 'text-white' : 'text-[#0B0E14]'}`}>
                          Waiting for a clarification
                        </p>
                        <p className={`mt-1 text-[10px] leading-relaxed ${compiled.meta.dark ? 'text-white/70' : 'text-[#64626F]'}`}>
                          Answer the question in the panel and this page will draw itself.
                        </p>
                      </div>
                    ) : submitted && compiled.meta.usedLines === 0 && compiled.meta.specLines > 0 ? (
                      <div className="px-4 text-center">
                        <p className={`text-[11px] font-bold ${compiled.meta.dark ? 'text-white' : 'text-[#0B0E14]'}`}>
                          No UI components on this page
                        </p>
                        <p className={`mt-1 text-[10px] leading-relaxed ${compiled.meta.dark ? 'text-white/70' : 'text-[#64626F]'}`}>
                          Describe the screen in UI terms — a heading, button, input, card or image — and the
                          wireframe will draw itself.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Layers className="mx-auto h-5 w-5 text-[#C3C1CE]" />
                        <p className="mt-2 text-[11px] font-bold text-[#0B0E14]">Nothing to preview</p>
                        <p className="mt-0.5 text-[10px] text-[#64626F]">
                          Write a prompt and press Analyse.
                        </p>
                      </div>
                    )
                  }
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-[var(--v-faint)]">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-3 rounded-[2px] border border-dashed border-[#E5484D]" />
                  unresolved attribute
                </span>
                <span>Schematic geometry · deterministic layout · no cloud call.</span>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--v-muted)]">
                  Revised prompt{screens.length > 1 ? ` · ${screens.length} pages` : ''}
                </p>
                <button
                  type="button"
                  onClick={copy}
                  className="text-[10.5px] font-bold text-[var(--v-violet)] hover:underline"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="mt-1 h-[430px] overflow-auto v-scroll rounded-xl bg-[var(--v-surface-2)] p-2.5 font-mono text-[9.5px] leading-relaxed text-[var(--v-muted)]">
                {revisedPrompt || 'Analyse a prompt and the revised prompt appears here.'}
              </pre>
            </div>
          )}

          <button
            type="button"
            onClick={() => setBuildOpen(true)}
            disabled={!submitted || elements.length === 0}
            className="mt-2 v-btn v-btn-primary h-9 w-full text-[11.5px] disabled:opacity-40"
          >
            Generate {screens.length > 1 ? `${screens.length} screens` : 'with this prompt'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>

      <SideBySideBuild open={buildOpen} prompt={revisedPrompt} onClose={() => setBuildOpen(false)} />
    </div>
  );
};
