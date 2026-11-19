/**
 * Asset library.
 *
 * Everything the user uploads, pastes or imports is kept here so it can be
 * reused across canvases. Stored in IndexedDB (not localStorage) because images
 * blow past the ~5 MB localStorage limit almost immediately.
 *
 * Privacy: this is a device-local store, keyed by nothing but the browser.
 * Moving it to a workspace library means pushing the same record to Supabase
 * Storage with a `workspace_id` prefix and RLS on the bucket.
 */

export type AssetKind = 'image' | 'file' | 'import';

export interface LibraryAsset {
  id: string;
  name: string;
  kind: AssetKind;
  mime: string;
  size: number;
  dataUrl: string;
  createdAt: string;
  source?: string;
}

const DB_NAME = 'vector_library';
const STORE = 'assets';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open the library.'));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      })
  );
}

/* localStorage fallback for browsers without IndexedDB */
const FALLBACK_KEY = 'vector_library_fallback_v1';

function readFallback(): LibraryAsset[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallback(items: LibraryAsset[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(items.slice(0, 40)));
  } catch {
    // Quota exhausted — keep going; the asset simply is not persisted.
  }
}

export async function addAsset(input: Omit<LibraryAsset, 'id' | 'createdAt'>): Promise<LibraryAsset> {
  const asset: LibraryAsset = {
    ...input,
    id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    await tx('readwrite', (store) => store.put(asset));
  } catch {
    writeFallback([asset, ...readFallback()]);
  }
  return asset;
}

export async function listAssets(): Promise<LibraryAsset[]> {
  try {
    const all = await tx<LibraryAsset[]>('readonly', (store) => store.getAll());
    return (all || []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return readFallback();
  }
}

export async function deleteAsset(id: string): Promise<void> {
  try {
    await tx('readwrite', (store) => store.delete(id));
  } catch {
    writeFallback(readFallback().filter((asset) => asset.id !== id));
  }
}

export async function clearLibrary(): Promise<void> {
  try {
    await tx('readwrite', (store) => store.clear());
  } catch {
    writeFallback([]);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function downloadAsset(asset: LibraryAsset): void {
  const link = document.createElement('a');
  link.href = asset.dataUrl;
  link.download = asset.name || 'vector-asset';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
