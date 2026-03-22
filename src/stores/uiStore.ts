import { create } from 'zustand'

import type { ReviewStatus } from '@/types/risk'

interface UiState {
  /** 明细表当前选中的筛选条件 */
  detailFilters: {
    ruleId: string | null;
    account: string | null;
    symbol: string | null;
    side: string | null;
    market: string | null;
    status: string | null;
    broker: string | null;
    search: string;
  };

  reviewStatusFilter: 'ALL' | ReviewStatus;
  sortBy: 'amount' | 'time' | 'ruleCount';
  advancedFiltersOpen: boolean;
  shortcutHintsVisible: boolean;

  setDetailFilter: (key: keyof UiState['detailFilters'], value: string | null) => void;
  resetDetailFilters: () => void;
  setReviewStatusFilter: (filter: 'ALL' | ReviewStatus) => void;
  setSortBy: (sort: 'amount' | 'time' | 'ruleCount') => void;
  setAdvancedFiltersOpen: (open: boolean) => void;
  setShortcutHintsVisible: (visible: boolean) => void;
}

const defaultFilters: UiState['detailFilters'] = {
  ruleId: null,
  account: null,
  symbol: null,
  side: null,
  market: null,
  status: null,
  broker: null,
  search: '',
}

export const useUiStore = create<UiState>((set) => ({
  detailFilters: { ...defaultFilters },

  reviewStatusFilter: 'ALL',
  sortBy: 'amount',
  advancedFiltersOpen: false,
  shortcutHintsVisible: true,

  setDetailFilter: (key, value) => {
    set(state => ({
      detailFilters: { ...state.detailFilters, [key]: value },
    }))
  },

  resetDetailFilters: () => {
    set({ detailFilters: { ...defaultFilters } })
  },

  setReviewStatusFilter: (filter) => set({ reviewStatusFilter: filter }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setAdvancedFiltersOpen: (open) => set({ advancedFiltersOpen: open }),
  setShortcutHintsVisible: (visible) => set({ shortcutHintsVisible: visible }),
}))
