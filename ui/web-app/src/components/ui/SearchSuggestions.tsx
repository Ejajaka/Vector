import React from 'react';
import type { VocabItem } from '../../hooks/useProjectVocabulary.ts';

interface SearchSuggestionsProps {
  items: VocabItem[];
  active: number;
  onPick: (item: VocabItem) => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ items, active, onPick }) => {
  if (items.length === 0) return null;

  return (
    <div className="v-scroll absolute left-0 right-0 top-full z-[70] mt-1 max-h-[260px] overflow-y-auto rounded-lg border border-[var(--v-line)] bg-[var(--v-surface)] p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)]">
      <p className="px-2 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.05em] text-[var(--v-faint)]">
        Project vocabulary
      </p>
      {items.map((item, index) => (
        <button
          key={`${item.kind}:${item.value}`}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(item)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
            index === active ? 'bg-[var(--v-surface-2)]' : 'hover:bg-[var(--v-surface-2)]'
          }`}
        >
          <span className="w-[72px] shrink-0 truncate rounded border border-[var(--v-line)] bg-[var(--v-bg)] px-1 py-0.5 text-center text-[8.5px] font-medium uppercase tracking-[0.04em] text-[var(--v-faint)]">
            {item.kind}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-[var(--v-ink-2)]">{item.value}</span>
          {item.detail && <span className="hidden shrink-0 text-[9.5px] text-[var(--v-faint)] sm:block">{item.detail}</span>}
        </button>
      ))}
      <p className="px-2 pb-1 pt-1.5 text-[9px] text-[var(--v-faint)]">Arrows to move · Enter to choose · Esc to close</p>
    </div>
  );
};
