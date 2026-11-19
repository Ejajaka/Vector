import React, { useEffect, useState } from 'react';
import { Copy, Download, FileText, Image as ImageIcon, Loader2, Search, Trash2, Upload, X } from 'lucide-react';
import {
  addAsset,
  clearLibrary,
  deleteAsset,
  downloadAsset,
  formatBytes,
  listAssets,
  type AssetKind,
  type LibraryAsset,
} from '../services/library.ts';

const FILTERS: Array<{ id: 'all' | AssetKind; label: string }> = [
  { id: 'all', label: 'Everything' },
  { id: 'image', label: 'Images' },
  { id: 'file', label: 'Files' },
  { id: 'import', label: 'Imports' },
];

export const LibraryPage: React.FC = () => {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | AssetKind>('all');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    setAssets(await listAssets());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const upload = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        await addAsset({
          name: file.name,
          kind: file.type.startsWith('image/') ? 'image' : 'file',
          mime: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: String(reader.result || ''),
          source: 'upload',
        });
        void refresh();
      };
      reader.readAsDataURL(file);
    });
  };

  const visible = assets.filter((asset) => {
    const matchesKind = filter === 'all' || asset.kind === filter;
    const matchesTerm = !query.trim() || asset.name.toLowerCase().includes(query.toLowerCase());
    return matchesKind && matchesTerm;
  });

  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);

  return (
    <div className="space-y-5 v-fade-up">
      <section className="flex flex-col gap-3 rounded-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="v-eyebrow">Library</p>
          <h1 className="v-display mt-1.5 text-[24px] text-[var(--v-ink)] sm:text-[28px]">Everything you have uploaded</h1>
          <p className="mt-1 max-w-xl text-[12.5px] text-[var(--v-muted)]">
            Images you drop on a canvas, files you attach, and imports are kept here so you can reuse them instead of
            uploading again. Stored on this device.
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-9 rounded-lg px-3.5 text-[11.5px] font-bold text-white inline-flex items-center gap-1.5"
            style={{ backgroundImage: 'linear-gradient(118deg,#7C5CFF,#4D7CFE 55%,#22D3EE)' }}
          >
            <Upload className="w-3.5 h-3.5" /> Add files
          </button>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto v-scroll">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)} className="v-chip" data-active={filter === item.id}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[200px] max-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--v-faint)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the library"
            className="v-input h-9 pl-9 pr-3 text-[12px]"
          />
        </div>
        <span className="text-[10.5px] text-[var(--v-faint)]">
          {assets.length} item{assets.length === 1 ? '' : 's'} · {formatBytes(totalSize)}
        </span>
        {assets.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              await clearLibrary();
              void refresh();
            }}
            className="h-8 rounded-lg border border-[var(--v-line)] px-2.5 text-[10.5px] font-semibold text-[var(--v-coral)] hover:bg-[var(--v-surface-2)]"
          >
            Clear
          </button>
        )}
      </section>

      {loading ? (
        <div className="grid place-items-center py-16 text-[var(--v-faint)]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--v-line)] bg-[var(--v-surface-2)] p-10 text-center">
          <ImageIcon className="mx-auto h-6 w-6 text-[var(--v-faint)]" />
          <p className="mt-2 text-[13.5px] font-bold text-[var(--v-ink)]">
            {assets.length === 0 ? 'Nothing in the library yet' : 'Nothing matches that filter'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[11.5px] text-[var(--v-muted)]">
            Drop an image on a canvas, paste one with ⌘V, or add files here.
          </p>
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 v-btn v-btn-primary h-9 px-4 text-[12px]">
            <Upload className="w-3.5 h-3.5" /> Add files
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {visible.map((asset) => (
            <article key={asset.id} className="group overflow-hidden rounded-xl border border-[var(--v-line)] bg-[var(--v-surface)]">
              <div className="relative grid h-[110px] place-items-center bg-[var(--v-surface-2)]">
                {asset.kind === 'image' ? (
                  <img src={asset.dataUrl} alt={asset.name} className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-7 w-7 text-[var(--v-faint)]" />
                )}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(asset.dataUrl);
                        setCopied(asset.id);
                        window.setTimeout(() => setCopied(null), 1400);
                      } catch {
                        // ignore
                      }
                    }}
                    className="grid h-6 w-6 place-items-center rounded-md bg-[var(--v-surface)]/90 text-[var(--v-ink)]"
                    aria-label="Copy data URL"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAsset(asset)}
                    className="grid h-6 w-6 place-items-center rounded-md bg-[var(--v-surface)]/90 text-[var(--v-ink)]"
                    aria-label="Download"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteAsset(asset.id);
                      void refresh();
                    }}
                    className="grid h-6 w-6 place-items-center rounded-md bg-[var(--v-surface)]/90 text-[var(--v-coral)]"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {copied === asset.id && (
                  <span className="absolute right-1.5 top-1.5 rounded bg-[var(--v-ink)] px-1.5 py-0.5 text-[8.5px] font-bold text-[var(--v-surface)]">
                    copied
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-[11px] font-bold text-[var(--v-ink)]">{asset.name}</p>
                <p className="text-[9.5px] text-[var(--v-faint)]">
                  {formatBytes(asset.size)} · {new Date(asset.createdAt).toLocaleDateString()}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          upload(Array.from(event.target.files || []));
          event.target.value = '';
        }}
      />
    </div>
  );
};
