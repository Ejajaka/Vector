// Persisted settings for the web app (deep scan credentials + behaviour).
export interface VectorSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  autoDeepScan: boolean;
}

const STORAGE_KEY = 'vector_webapp_settings_v1';

export const DEFAULT_SETTINGS: VectorSettings = {
  apiKey: '',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  model: 'gemini-3.8-flash',
  autoDeepScan: true
};

export function loadSettings(): VectorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: VectorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota/private-mode errors
  }
}

export function onDeviceModelAvailable(): boolean {
  const llm = (globalThis as any).VectorLLM;
  try {
    return !!(llm && llm.localAvailable && llm.localAvailable());
  } catch {
    return false;
  }
}

export function deepScanAvailable(settings: VectorSettings): boolean {
  return !!settings.apiKey || onDeviceModelAvailable();
}
