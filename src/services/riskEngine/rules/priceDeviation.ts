import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatPercent } from '@/utils/formatters'
import { isExecutedOrder, paramAsNumber } from '../utils'

/** R005: 成交价格偏离 — 成交均价偏离委托价格超过阈值（含部分成交） */
export const priceDeviationRule: RuleExecutor = {
  ruleId: 'R005',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const threshold = paramAsNumber(config, 'deviation_threshold', 0.05)
    const flags: RiskFlag[] = []

    for (const order of orders) {
      if (!isExecutedOrder(order)) continue
      if (order.filled_quantity <= 0 || order.order_price <= 0) continue

      const deviation = Math.abs(order.filled_avg_price - order.order_price) / order.order_price
      if (deviation >= threshold) {
        flags.push({
          rule_id: config.rule_id,
          rule_name: config.name,
          severity: config.severity,
          description: `成交均价 ${order.filled_avg_price.toFixed(4)} 偏离委托价格 ${order.order_price.toFixed(4)}，偏离幅度 ${formatPercent(deviation)}，超过阈值 ${formatPercent(threshold)}`,
          related_orders: [order.order_id],
        })
      }
    }

    return flags
  },
}
