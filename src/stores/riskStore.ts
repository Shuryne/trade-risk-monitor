import { create } from 'zustand'
import type { RiskResult, ReviewStatus } from '@/types/risk'
import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import { runRiskEngine } from '@/services/riskEngine'

interface RiskState {
  results: RiskResult[];
  hasResults: boolean;
  notes: Record<string, string>;
  reviewTimestamps: Record<string, string>;
  firstReviewAt: string | null;
  lastReviewAt: string | null;

  analyze: (orders: Order[], ruleConfigs: RuleConfig[]) => void;
  updateReviewStatus: (orderId: string, status: ReviewStatus) => void;
  batchUpdateReviewStatus: (orderIds: string[], status: ReviewStatus) => void;
  setNote: (orderId: string, note: string) => void;
  restoreReviewData: (data: {
    notes: Record<string, string>;
    reviewTimestamps: Record<string, string>;
    firstReviewAt: string | null;
    lastReviewAt: string | null;
  }) => void;
  clear: () => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  results: [],
  hasResults: false,
  notes: {},
  reviewTimestamps: {},
  firstReviewAt: null,
  lastReviewAt: null,

  analyze: (orders, ruleConfigs) => {
    const results = runRiskEngine(orders, ruleConfigs)
    set({ results, hasResults: true })
  },

  updateReviewStatus: (orderId, status) =>
    set((state) => {
      const now = new Date().toISOString();
      return {
        results: state.results.map((r) =>
          r.order.order_id === orderId ? { ...r, review_status: status } : r
        ),
        reviewTimestamps: { ...state.reviewTimestamps, [orderId]: now },
        firstReviewAt: state.firstReviewAt ?? now,
        lastReviewAt: now,
      };
    }),

  batchUpdateReviewStatus: (orderIds, status) => {
    if (orderIds.length === 0) return
    const idSet = new Set(orderIds)
    set((state) => {
      const now = new Date().toISOString();
      const newTimestamps: Record<string, string> = {}
      idSet.forEach(id => { newTimestamps[id] = now })
      return {
        results: state.results.map(r =>
          idSet.has(r.order.order_id) && r.review_status !== status
            ? { ...r, review_status: status }
            : r
        ),
        reviewTimestamps: { ...state.reviewTimestamps, ...newTimestamps },
        firstReviewAt: state.firstReviewAt ?? now,
        lastReviewAt: now,
      }
    })
  },

  setNote: (orderId, note) =>
    set((state) => ({
      notes: { ...state.notes, [orderId]: note },
    })),

  restoreReviewData: (data) => set(data),

  clear: () => set({
    results: [],
    hasResults: false,
    notes: {},
    reviewTimestamps: {},
    firstReviewAt: null,
    lastReviewAt: null,
  }),
}))
