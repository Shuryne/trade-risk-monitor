import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatAmount } from '@/utils/formatters'
import { paramAsNumber } from '../utils'

/** R001: 大额交易检测 — 单笔委托金额超过阈值（按市场分别设置） */
export const largeOrderRule: RuleExecutor = {
  ruleId: 'R001',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const thresholdHK = paramAsNumber(config, 'threshold_hk', 5_000_000)
    const thresholdUS = paramAsNumber(config, 'threshold_us', 1_000_000)
    const flags: RiskFlag[] = []

    for (const order of orders) {
      const threshold = order.market === 'HK' ? thresholdHK : thresholdUS
      if (order.order_amount >= threshold) {
        flags.push({
          rule_id: config.rule_id,
          rule_name: config.name,
          severity: config.severity,
          description: `委托金额 ${formatAmount(order.order_amount, order.currency)} 超过阈值 ${formatAmount(threshold, order.currency)}`,
          related_orders: [order.order_id],
        })
      }
    }

    return flags
  },
}
