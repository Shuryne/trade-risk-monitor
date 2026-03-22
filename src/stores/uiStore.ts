import { create } from 'zustand'

interface UiState {
  /** 明细表当前选中的筛选条件 */
  detailFilters: {
    severity: string | null;
    ruleId: string | null;
    account: string | null;
    symbol: string | null;
    side: string | null;
    market: string | null;
    status: string | null;
    search: string;
  };

  setDetailFilter: (key: keyof UiState['detailFilters'], value: string | null) => void;
  resetDetailFilters: () => void;
}

const defaultFilters: UiState['detailFilters'] = {
  severity: null,
  ruleId: null,
  account: null,
  symbol: null,
  side: null,
  market: null,
  status: null,
  search: '',
}

export const useUiStore = create<UiState>((set) => ({
  detailFilters: { ...defaultFilters },

  setDetailFilter: (key, value) => {
    set(state => ({
      detailFilters: { ...state.detailFilters, [key]: value },
    }))
  },

  resetDetailFilters: () => {
    set({ detailFilters: { ...defaultFilters } })
  },
}))
