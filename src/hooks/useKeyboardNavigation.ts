import { useState, useEffect, useRef } from 'react';

export interface UseKeyboardNavigationOptions {
  orderIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMarkReviewed: (id: string) => void;
  onMarkFollowUp: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onToggleGroup: (direction: 'collapse' | 'expand') => void;
  onFocusSearch: () => void;
  onEscape: () => void;
  getNextPendingId: (currentId: string) => string | null;
  listRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
}

export interface UseKeyboardNavigationReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions,
): UseKeyboardNavigationReturn {
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Keep a stable ref to the latest options so the keydown handler never
  // needs to be recreated when callbacks change identity between renders.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Keep a stable ref to focusedIndex so the handler always reads the latest
  // value without being listed as a dependency.
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;

  // Sync focusedIndex when selectedId changes externally.
  useEffect(() => {
    const { selectedId, orderIds } = optionsRef.current;
    if (selectedId) {
      const idx = orderIds.indexOf(selectedId);
      if (idx !== -1) setFocusedIndex(idx);
    }
    // Re-run when the caller changes the selected id or the list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.selectedId, options.orderIds]);

  // Single stable keydown listener — no dependency on options or focusedIndex
  // directly; both are accessed via refs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const {
        enabled,
        orderIds,
        listRef,
        onFocusSearch,
        onEscape,
        onSelect,
        onToggleCheck,
        onToggleGroup,
        onMarkReviewed,
        onMarkFollowUp,
        getNextPendingId,
      } = optionsRef.current;

      if (!enabled) return;

      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      // `/` and `Escape` always fire regardless of focus location.
      if (e.key === '/') {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      if (e.key === 'Escape') {
        if (isInInput) {
          // Return DOM focus to the list container.
          listRef.current?.focus();
        }
        onEscape();
        return;
      }

      // All remaining shortcuts require the list to be focused (not an input).
      if (isInInput) return;

      const currentFocused = focusedIndexRef.current;
      const currentId = orderIds[currentFocused];

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          const newIndex = Math.max(0, currentFocused - 1);
          setFocusedIndex(newIndex);
          focusedIndexRef.current = newIndex;
          const id = orderIds[newIndex];
          if (id) {
            onSelect(id);
            if (e.shiftKey) onToggleCheck(id);
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const newIndex = Math.min(orderIds.length - 1, currentFocused + 1);
          setFocusedIndex(newIndex);
          focusedIndexRef.current = newIndex;
          const id = orderIds[newIndex];
          if (id) {
            onSelect(id);
            if (e.shiftKey) onToggleCheck(id);
          }
          break;
        }
        case 'ArrowLeft':
          e.preventDefault();
          onToggleGroup('collapse');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onToggleGroup('expand');
          break;
        case 'Enter': {
          e.preventDefault();
          if (currentId) {
            onMarkReviewed(currentId);
            const nextId = getNextPendingId(currentId);
            if (nextId) {
              const nextIdx = orderIds.indexOf(nextId);
              if (nextIdx !== -1) {
                setFocusedIndex(nextIdx);
                focusedIndexRef.current = nextIdx;
                onSelect(nextId);
              }
            }
          }
          break;
        }
        case 'f':
          if (currentId) onMarkFollowUp(currentId);
          break;
        case ' ':
          e.preventDefault();
          if (currentId) onToggleCheck(currentId);
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // Empty deps: the handler is created once and reads live data through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { focusedIndex, setFocusedIndex };
}
