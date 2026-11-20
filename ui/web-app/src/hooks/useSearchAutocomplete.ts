import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { VocabItem } from './useProjectVocabulary.ts';

interface Options {
  minChars?: number;
  max?: number;
  onPick?: (item: VocabItem) => void;
}

export function useSearchAutocomplete(
  items: VocabItem[],
  query: string,
  setQuery: (value: string) => void,
  options: Options = {}
) {
  const { minChars = 1, max = 6, onPick } = options;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < minChars) return [];
    return items
      .filter((item) => item.value.toLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.value.toLowerCase().startsWith(term) ? 0 : 1;
        const bStarts = b.value.toLowerCase().startsWith(term) ? 0 : 1;
        return aStarts - bStarts;
      })
      .slice(0, max);
  }, [items, query, minChars, max]);

  useEffect(() => {
    setActive(-1);
  }, [query]);

  const pick = (item: VocabItem) => {
    setQuery(item.value);
    setOpen(false);
    setActive(-1);
    onPick?.(item);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => (value + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => (value <= 0 ? suggestions.length - 1 : value - 1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      pick(suggestions[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return {
    open,
    setOpen,
    active,
    suggestions,
    onKeyDown,
    pick,
  };
}
