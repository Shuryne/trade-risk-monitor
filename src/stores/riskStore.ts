import { create } from 'zustand'
import type { RiskResult, ReviewStatus } from '@/types/risk'
import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import { runRiskEngine } from '@/services/riskEngine'

interface RiskState {
  results: RiskResult[];
  hasResults: boolean;
  error: string | null;

  analyze: (orders: Order[], ruleConfigs: RuleConfig[]) => void;
  updateReviewStatus: (orderId: string, status: ReviewStatus) => void;
  batchUpdateReviewStatus: (orderIds: string[], status: ReviewStatus) => void;
  clear: () => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  results: [],
  hasResults: false,
  error: null,

  analyze: (orders, ruleConfigs) => {
    try {
      const results = runRiskEngine(orders, ruleConfigs)
      set({ results, hasResults: true, error: null })
    } catch (err) {
      console.error('Risk analysis failed:', err)
      set({ results: [], hasResults: false, error: String(err) })
    }
  },

  updateReviewStatus: (orderId, status) => {
    set(state => {
      const idx = state.results.findIndex(r => r.order.order_id === orderId)
      if (idx === -1 || state.results[idx].review_status === status) return state
      const results = [...state.results]
      results[idx] = { ...results[idx], review_status: status }
      return { results }
    })
  },

  batchUpdateReviewStatus: (orderIds, status) => {
    if (orderIds.length === 0) return
    const idSet = new Set(orderIds)
    set(state => ({
      results: state.results.map(r =>
        idSet.has(r.order.order_id) && r.review_status !== status
          ? { ...r, review_status: status }
          : r
      ),
    }))
  },

  clear: () => set({ results: [], hasResults: false, error: null }),
}))
