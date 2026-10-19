// Local history persistence (AsyncStorage). No seeded/sample records.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'vector_history_v1';
const MAX = 50;

export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export async function saveHistory(list) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify((list || []).slice(0, MAX)));
  } catch (e) {
    // ignore
  }
}

export async function addToHistory(analysis) {
  const list = await loadHistory();
  const filtered = list.filter((x) => x.id !== analysis.id);
  const updated = [analysis, ...filtered].slice(0, MAX);
  await saveHistory(updated);
  return updated;
}

export async function deleteFromHistory(id) {
  const list = await loadHistory();
  const updated = list.filter((x) => x.id !== id);
  await saveHistory(updated);
  return updated;
}

export async function clearHistory() {
  await saveHistory([]);
  return [];
}
