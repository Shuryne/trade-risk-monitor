import { create } from 'zustand'
import type { RiskResult, ReviewStatus } from '@/types/risk'
import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import { runRiskEngine } from '@/services/riskEngine'

interface RiskState {
  results: RiskResult[];
  hasResults: boolean;

  /** 运行风险引擎 */
  analyze: (orders: Order[], ruleConfigs: RuleConfig[]) => void;
  /** 更新单条订单的审阅状态 */
  updateReviewStatus: (orderId: string, status: ReviewStatus) => void;
  /** 批量更新审阅状态 */
  batchUpdateReviewStatus: (orderIds: string[], status: ReviewStatus) => void;
  /** 清除结果 */
  clear: () => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  results: [],
  hasResults: false,

  analyze: (orders, ruleConfigs) => {
    const results = runRiskEngine(orders, ruleConfigs)
    set({ results, hasResults: true })
  },

  updateReviewStatus: (orderId, status) => {
    set(state => ({
      results: state.results.map(r =>
        r.order.order_id === orderId ? { ...r, review_status: status } : r
      ),
    }))
  },

  batchUpdateReviewStatus: (orderIds, status) => {
    const idSet = new Set(orderIds)
    set(state => ({
      results: state.results.map(r =>
        idSet.has(r.order.order_id) ? { ...r, review_status: status } : r
      ),
    }))
  },

  clear: () => set({ results: [], hasResults: false }),
}))
