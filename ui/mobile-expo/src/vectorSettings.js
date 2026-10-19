// Deep-scan (LLM) settings for the Expo client, persisted on-device.
// Kept separate from settings.js because sync-engine.ps1 overwrites that file.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'vector.llm.settings.v1';

export const DEFAULT_LLM_SETTINGS = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  autoDeepScan: true,
};

export async function loadLlmSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return { ...DEFAULT_LLM_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch (e) {
    return { ...DEFAULT_LLM_SETTINGS };
  }
}

export async function saveLlmSettings(next) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next || {}));
  } catch (e) {
    // Settings are best-effort; never block analysis on storage failures.
  }
}
