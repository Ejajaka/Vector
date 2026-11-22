/**
 * On-device speech-to-text fallback.
 *
 * Chrome's Web Speech API depends on Google's speech service, which is blocked
 * on some networks. This module records a clip in the browser and transcribes
 * it with Whisper tiny (ONNX/transformers.js) served from /models, so voice
 * still works without any external speech API or key.
 */

import { env, pipeline } from '@huggingface/transformers';
import { loadSettings } from './settings.ts';

export interface LocalSTTProgress {
  percent: number;
  file: string;
}

export type LocalSTTProgressHandler = (progress: LocalSTTProgress) => void;

const BASE = import.meta.env.BASE_URL || './';
const MODEL_ID = 'whisper_tiny_en';

let asrPromise: Promise<any> | null = null;
let progressHandler: LocalSTTProgressHandler | null = null;

function configure(): void {
  env.allowLocalModels = true;
  env.useBrowserCache = true;
  env.localModelPath = `${BASE}models/`;
}

async function loadASR(onProgress?: LocalSTTProgressHandler): Promise<any> {
  // The most recent caller owns the progress display.
  if (onProgress) progressHandler = onProgress;
  if (!asrPromise) {
    configure();
    asrPromise = pipeline('automatic-speech-recognition', MODEL_ID, {
      dtype: 'q8',
      progress_callback: (progress: any) => {
        if (!progressHandler) return;
        if (progress?.status === 'progress' && progress.total) {
          progressHandler({
            percent: Math.round((progress.loaded / progress.total) * 100),
            file: String(progress.file || MODEL_ID),
          });
        } else if (progress?.status === 'done') {
          progressHandler({ percent: 100, file: String(progress.file || MODEL_ID) });
        }
      },
    } as any);
  }
  return asrPromise;
}

/** Decode any recorded audio blob and resample it to 16 kHz mono Float32. */
async function toWhisperAudio(blob: Blob): Promise<Float32Array> {
  const bytes = await blob.arrayBuffer();
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(bytes.slice(0));
    const seconds = Math.max(0.2, Math.min(decoded.duration, 120));
    const frames = Math.ceil(seconds * 16000);
    const offline = new OfflineAudioContext(1, frames, 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } finally {
    await context.close().catch(() => undefined);
  }
}

export async function transcribeLocally(
  blob: Blob,
  onProgress?: LocalSTTProgressHandler
): Promise<string> {
  const asr = await loadASR(onProgress);
  const audio = await toWhisperAudio(blob);
  // whisper-tiny.en is English-only, so task/language must be omitted.
  const result = await asr(audio, {
    chunk_length_s: 30,
    stride_length_s: 5,
  });
  return String(result?.text || '').trim();
}

function audioFileName(blob: Blob): string {
  const type = (blob.type || '').toLowerCase();
  if (type.includes('mp4') || type.includes('m4a')) return 'speech.m4a';
  if (type.includes('ogg')) return 'speech.ogg';
  if (type.includes('wav')) return 'speech.wav';
  if (type.includes('mpeg') || type.includes('mp3')) return 'speech.mp3';
  return 'speech.webm';
}

/**
 * Whisper over the configured OpenAI-compatible provider (Groq by default).
 * This is the reliable path: it needs no local model files and works on any
 * network where the app can reach the provider.
 */
async function transcribeWithProvider(
  blob: Blob,
  onProgress?: LocalSTTProgressHandler
): Promise<string | null> {
  const settings = loadSettings();
  const base = (settings.baseUrl || '').replace(/\/$/, '');
  const key = settings.apiKey || '';
  if (!base || !key || key === 'server-proxy') return null;
  if (!/groq\.com|openai\.com|api\.groq|openrouter/i.test(base)) return null;

  const model = /groq/i.test(base) ? 'whisper-large-v3-turbo' : 'whisper-1';
  const form = new FormData();
  form.append('file', blob, audioFileName(blob));
  form.append('model', model);
  form.append('language', 'en');
  onProgress?.({ percent: 100, file: 'Whisper' });

  try {
    const response = await fetch(`${base}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!response.ok) return null;
    const body = await response.json();
    return String(body?.text || '').trim();
  } catch {
    return null;
  }
}

/**
 * Transcribe a recording. The hosted Whisper model is tried first, then the
 * bundled on-device model when it is available in the deployment.
 */
export async function transcribeSpeech(
  blob: Blob,
  onProgress?: LocalSTTProgressHandler
): Promise<string> {
  const hosted = await transcribeWithProvider(blob, onProgress);
  if (hosted) return hosted;
  return transcribeLocally(blob, onProgress);
}

/** Preload the model so the first recording is faster. */
export async function preloadLocalSTT(onProgress?: LocalSTTProgressHandler): Promise<void> {
  await loadASR(onProgress);
}
