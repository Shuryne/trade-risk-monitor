import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { minutesDiff } from '@/utils/timezone'
import { formatPercent } from '@/utils/formatters'

/**
 * R010: 洗售交易检测
 * 同一账户在短时间内对同一标的先买后卖（或先卖后买），数量相近。
 */
export const selfTradingRule: RuleExecutor = {
  ruleId: 'R010',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const windowMinutes = Number(config.params['time_window_minutes']) || 10
    const qtyDeviationThreshold = Number(config.params['quantity_deviation_threshold']) || 0.05
    const flags: RiskFlag[] = []
    const flaggedPairs = new Set<string>()

    // 按 账户 + 标的 分组
    const byAccountSymbol = new Map<string, Order[]>()
    for (const order of orders) {
      const key = `${order.account_id}|${order.symbol}`
      const list = byAccountSymbol.get(key) ?? []
      list.push(order)
      byAccountSymbol.set(key, list)
    }

    for (const [key, groupOrders] of byAccountSymbol) {
      if (groupOrders.length < 2) continue
      const [accountId, symbol] = key.split('|')

      for (let i = 0; i < groupOrders.length; i++) {
        for (let j = i + 1; j < groupOrders.length; j++) {
          const a = groupOrders[i]
          const b = groupOrders[j]

          // 必须方向相反
          if (a.side === b.side) continue

          // 时间窗口
          if (minutesDiff(a.order_time, b.order_time) > windowMinutes) continue

          // 数量偏差
          const maxQty = Math.max(a.order_quantity, b.order_quantity)
          if (maxQty === 0) continue
          const qtyDeviation = Math.abs(a.order_quantity - b.order_quantity) / maxQty
          if (qtyDeviation > qtyDeviationThreshold) continue

          const pairKey = [a.order_id, b.order_id].sort().join('-')
          if (flaggedPairs.has(pairKey)) continue
          flaggedPairs.add(pairKey)

          const desc = `账户 ${accountId} 疑似洗售: ${symbol} ${a.side} ${a.order_quantity} 与 ${b.side} ${b.order_quantity}，时间差 ${minutesDiff(a.order_time, b.order_time).toFixed(1)} 分钟，数量偏差 ${formatPercent(qtyDeviation)}`

          flags.push({
            rule_id: config.rule_id,
            rule_name: config.name,
            severity: config.severity,
            description: desc,
            related_orders: [a.order_id, b.order_id],
          })
          flags.push({
            rule_id: config.rule_id,
            rule_name: config.name,
            severity: config.severity,
            description: desc,
            related_orders: [b.order_id, a.order_id],
          })
        }
      }
    }

    return flags
  },
}
