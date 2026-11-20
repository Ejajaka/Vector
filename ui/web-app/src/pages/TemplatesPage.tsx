import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Crown, Layers, Lock, Search, Sparkles, X } from 'lucide-react';
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
  type TemplateDefinition,
} from '../data/templates.ts';
import { isPaid, readEntitlements } from '../services/entitlements.ts';
import { TemplateArt } from '../components/templates/TemplateArt.tsx';
import { SpotlightHost } from '../components/onboarding/SpotlightHost.tsx';
import {
  deletePrivate,
  importPrivateTemplate,
  listPrivate,
  pagesFromPrivate,
  type PrivateTemplate,
} from '../services/privateTemplates.ts';

interface TemplatesPageProps {
  onUseTemplate: (template: TemplateDefinition) => void;
  onOpenTemplate: (template: TemplateDefinition) => void;
  onOpenPrivate: (name: string, pages: ReturnType<typeof pagesFromPrivate>) => void;
  onNavigatePricing: () => void;
}

const Preview: React.FC<{ template: TemplateDefinition; detail?: boolean; page?: number }> = ({
  template,
  detail,
  page = 0,
}) => <TemplateArt template={template} detail={detail} page={page} />;

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  onUseTemplate,
  onOpenTemplate,
  onOpenPrivate,
  onNavigatePricing,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'All'>('All');
  const [preview, setPreview] = useState<TemplateDefinition | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [privates, setPrivates] = useState<PrivateTemplate[]>(() => listPrivate());
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const paid = isPaid(readEntitlements());

  useEffect(() => {
    setPreviewPage(0);
  }, [preview?.id]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return TEMPLATES.filter((template) => {
      const inCategory = category === 'All' || template.category === category;
      const matches =
        !term ||
        template.name.toLowerCase().includes(term) ||
        template.tagline.toLowerCase().includes(term) ||
        template.tags.some((tag) => tag.includes(term));
      return inCategory && matches;
    });
  }, [query, category]);

  const use = (template: TemplateDefinition) => {
    if (template.pro && !paid) {
      onNavigatePricing();
      return;
    }
    onUseTemplate(template);
  };

  return (
    <div className="space-y-6 v-fade-up">
      <SpotlightHost page="templates" />
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="v-eyebrow">Template library</p>
          <h1 className="v-display mt-1 text-[26px] text-[var(--v-ink)]">Start from something real</h1>
          <p className="mt-1 max-w-[640px] text-[13px] text-[var(--v-muted)]">
            Ten production-shaped starting points. Preview the exact attributes each one fills in before you commit.
          </p>
        </div>
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--v-faint)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates..."
            className="v-input h-[30px] pl-8 pr-3 text-[12px]"
          />
        </div>
      </section>

      <div className="v-scroll flex items-center gap-2 overflow-x-auto pb-1">
        {TEMPLATE_CATEGORIES.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className="v-chip" data-active={category === item}>
            {item}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-4">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-[var(--v-muted)]" />
          <p className="text-[12.5px] font-semibold text-[var(--v-ink)]">Workspace library</p>
          <span className="rounded bg-[var(--v-surface-2)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--v-muted)]">
            Private
          </span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="ml-auto h-7 rounded-lg border border-[var(--v-line)] px-2.5 text-[10.5px] font-semibold text-[var(--v-ink)] hover:bg-[var(--v-surface-2)]"
          >
            Import design JSON
          </button>
        </div>
        <p className="mt-1 text-[11px] text-[var(--v-muted)]">
          Your organisation's own documented formats. Only this workspace can see or open them — they never enter the public library.
        </p>

        {importError && <p className="mt-2 text-[10.5px] text-[var(--v-coral)]">{importError}</p>}

        {privates.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {privates.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--v-line)] bg-[var(--v-surface-2)] p-2.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 shrink-0 text-[var(--v-muted)]" />
                  <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-[var(--v-ink)]">{item.name}</p>
                  <span className="shrink-0 text-[9px] text-[var(--v-faint)]">{item.pages.length}p</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--v-muted)]">{item.description}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenPrivate(item.name, pagesFromPrivate(item))}
                    className="h-7 flex-1 rounded-md bg-[var(--v-ink)] text-[10px] font-semibold text-[var(--v-surface)]"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deletePrivate(item.id);
                      setPrivates(listPrivate());
                    }}
                    className="h-7 rounded-md border border-[var(--v-line)] px-2 text-[10px] font-semibold text-[var(--v-muted)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            try {
              importPrivateTemplate(await file.text());
              setPrivates(listPrivate());
              setImportError('');
            } catch (error) {
              setImportError(error instanceof Error ? error.message : 'Import failed.');
            }
          }}
        />
      </section>

      <section data-spot="templates-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((template) => (
          <article key={template.id} className="group">
            <button
              type="button"
              onClick={() => onOpenTemplate(template)}
              className="block w-full overflow-hidden rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--v-line-strong)]"
            >
              <div className="relative aspect-[4/3]">
                <Preview template={template} />
                {template.pro && !paid && (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#14121F]/80 text-white text-[9px] font-semibold uppercase tracking-wider">
                    <Crown className="w-2.5 h-2.5 text-[#FFC53D]" /> Pro
                  </span>
                )}
                <span className="absolute inset-0 bg-[#14121F]/0 group-hover:bg-[#14121F]/25 transition-colors" />
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--v-surface-2)] text-[var(--v-muted)]">
                    {template.category}
                  </span>
                  <span className="text-[8.5px] text-[var(--v-faint)]">{template.blocks.length} el</span>
                </div>
                <h3 className="mt-1 truncate text-[11.5px] font-semibold text-[var(--v-ink)]">{template.name}</h3>
                <p className="mt-0.5 line-clamp-1 text-[9.5px] text-[var(--v-muted)]">{template.tagline}</p>
              </div>
            </button>

            <div className="mt-1.5 flex gap-1.5">
              <button
                type="button"
                onClick={() => onOpenTemplate(template)}
                className="v-btn h-7 flex-1 rounded-md px-2 text-[10.5px]"
              >
                {template.pro && !paid ? <Lock className="w-2.5 h-2.5" /> : null} Open
              </button>
              <button
                type="button"
                onClick={() => setPreview(template)}
                className="v-btn v-btn-ghost h-7 rounded-md px-2 text-[10.5px]"
              >
                Preview
              </button>
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="v-card mx-auto max-w-lg rounded-lg p-10 text-center">
          <Sparkles className="w-6 h-6 mx-auto text-[var(--v-faint)]" />
          <p className="mt-2 text-[13px] font-semibold text-[var(--v-ink)]">No templates match “{query}”</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
            className="mt-3 text-[12px] font-semibold text-[var(--v-violet)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <div className="absolute inset-0 bg-[#14121F]/55 backdrop-blur-sm" onClick={() => setPreview(null)} aria-hidden="true" />
          <div className="v-scroll relative max-h-[calc(100vh-1rem)] w-full max-w-[880px] overflow-y-auto rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] shadow-[var(--v-shadow-lg)]">
            <div className="grid md:grid-cols-[1.05fr_1fr]">
              <div className="relative">
                {preview.pages && preview.pages.length > 0 && (
                  <div className="v-scroll flex gap-1.5 overflow-x-auto px-3 pb-1.5 pt-3">
                    {[0, ...preview.pages.map((_, index) => index + 1)].map((pageIndex) => (
                      <button
                        key={pageIndex}
                        type="button"
                        onClick={() => setPreviewPage(pageIndex)}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                          previewPage === pageIndex
                            ? 'bg-[var(--v-ink)] text-[var(--v-surface)]'
                            : 'bg-[var(--v-surface-2)] text-[var(--v-muted)] hover:text-[var(--v-ink)]'
                        }`}
                      >
                        {pageIndex === 0 ? 'Main' : preview.pages![pageIndex - 1].name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="h-[130px] overflow-hidden sm:h-[220px] md:h-[300px]">
                  <Preview template={preview} detail page={previewPage} />
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="v-eyebrow">{preview.category}</p>
                    <h2 className="v-display mt-1 text-[21px] text-[var(--v-ink)] sm:text-[24px]">{preview.name}</h2>
                  </div>
                  <button type="button" onClick={() => setPreview(null)} className="v-icon-btn -mr-2 -mt-2" aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--v-muted)]">{preview.description}</p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {preview.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-[var(--v-surface-2)] text-[10px] font-medium text-[var(--v-muted)]">
                      #{tag}
                    </span>
                  ))}
                </div>

                <h3 className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--v-faint)]">
                  <Layers className="w-3 h-3" /> What is included
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
                  {preview.blocks.map((block) => (
                    <div key={block.label}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-[var(--v-surface-2)] text-[var(--v-violet)]">
                          {block.type}
                        </span>
                        <span className="text-[11.5px] font-semibold text-[var(--v-ink)]">{block.label}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1">
                        {block.attrs.map((attr) => (
                          <span key={attr} className="inline-flex items-center gap-1 text-[10px] text-[var(--v-muted)]">
                            <Check className="w-2.5 h-2.5 text-[var(--v-teal)]" /> {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => use(preview)}
                  className="mt-4 w-full v-btn v-btn-primary h-9 text-[12px]"
                >
                  {preview.pro && !paid ? <Lock className="w-3.5 h-3.5" /> : null}
                  Use this template <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <p className="mt-1.5 text-center text-[9.5px] text-[var(--v-faint)]">
                  Creates a project and opens the prompt studio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
