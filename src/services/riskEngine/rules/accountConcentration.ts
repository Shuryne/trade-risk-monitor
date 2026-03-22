import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatPercent } from '@/utils/formatters'
import { isExecutedOrder } from '../utils'

/** R003: 单账户集中度 — 按市场分别计算，仅统计已成交订单金额 */
export const accountConcentrationRule: RuleExecutor = {
  ruleId: 'R003',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const threshold = Number(config.params['concentration_threshold']) || 0.35
    const flags: RiskFlag[] = []

    const byMarket = new Map<string, Order[]>()
    for (const order of orders) {
      const list = byMarket.get(order.market) ?? []
      list.push(order)
      byMarket.set(order.market, list)
    }

    for (const [market, marketOrders] of byMarket) {
      let totalAmount = 0
      const byAccount = new Map<string, { amount: number; allOrders: Order[] }>()

      for (const order of marketOrders) {
        const entry = byAccount.get(order.account_id) ?? { amount: 0, allOrders: [] }
        if (isExecutedOrder(order)) {
          entry.amount += order.order_amount
          totalAmount += order.order_amount
        }
        entry.allOrders.push(order)
        byAccount.set(order.account_id, entry)
      }

      if (totalAmount === 0) continue

      for (const [accountId, { amount, allOrders }] of byAccount) {
        if (amount === 0) continue
        const concentration = amount / totalAmount
        if (concentration >= threshold) {
          for (const order of allOrders) {
            flags.push({
              rule_id: config.rule_id,
              rule_name: config.name,
              severity: config.severity,
              description: `账户 ${accountId} 在 ${market} 市场已成交集中度 ${formatPercent(concentration)}，超过阈值 ${formatPercent(threshold)}`,
              related_orders: [order.order_id],
            })
          }
        }
      }
    }

    return flags
  },
}
