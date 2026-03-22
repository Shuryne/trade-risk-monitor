import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatAmount } from '@/utils/formatters'
import { paramAsNumber } from '../utils'

/** R008: Penny Stock 交易 — 低价股的大额交易（仅 HK 市场） */
export const pennyStockRule: RuleExecutor = {
  ruleId: 'R008',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const priceThreshold = paramAsNumber(config, 'price_threshold', 1)
    const amountThreshold = paramAsNumber(config, 'amount_threshold_hk', 500_000)
    const flags: RiskFlag[] = []

    for (const order of orders) {
      if (order.market !== 'HK') continue
      if (order.order_price >= priceThreshold) continue
      if (order.order_amount < amountThreshold) continue

      flags.push({
        rule_id: config.rule_id,
        rule_name: config.name,
        severity: config.severity,
        description: `低价股大额交易: ${order.symbol} 价格 ${order.order_price.toFixed(4)} HKD < ${priceThreshold} HKD，委托金额 ${formatAmount(order.order_amount, 'HKD')}`,
        related_orders: [order.order_id],
      })
    }

    return flags
  },
}
