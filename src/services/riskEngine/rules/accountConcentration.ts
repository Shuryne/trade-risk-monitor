import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatPercent } from '@/utils/formatters'

/** R003: 单账户集中度 — 按市场分别计算 */
export const accountConcentrationRule: RuleExecutor = {
  ruleId: 'R003',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const threshold = Number(config.params['concentration_threshold']) || 0.25
    const flags: RiskFlag[] = []

    // 按市场分别计算
    const byMarket = new Map<string, Order[]>()
    for (const order of orders) {
      const list = byMarket.get(order.market) ?? []
      list.push(order)
      byMarket.set(order.market, list)
    }

    for (const [market, marketOrders] of byMarket) {
      const totalAmount = marketOrders.reduce((sum, o) => sum + o.order_amount, 0)
      if (totalAmount === 0) continue

      // 按账户汇总
      const byAccount = new Map<string, { amount: number; orders: Order[] }>()
      for (const order of marketOrders) {
        const entry = byAccount.get(order.account_id) ?? { amount: 0, orders: [] }
        entry.amount += order.order_amount
        entry.orders.push(order)
        byAccount.set(order.account_id, entry)
      }

      for (const [accountId, { amount, orders: accountOrders }] of byAccount) {
        const concentration = amount / totalAmount
        if (concentration >= threshold) {
          for (const order of accountOrders) {
            flags.push({
              rule_id: config.rule_id,
              rule_name: config.name,
              severity: config.severity,
              description: `账户 ${accountId} 在 ${market} 市场集中度 ${formatPercent(concentration)}，超过阈值 ${formatPercent(threshold)}`,
              related_orders: [order.order_id],
            })
          }
        }
      }
    }

    return flags
  },
}
