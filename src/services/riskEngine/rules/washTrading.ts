import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { minutesDiff } from '@/utils/timezone'
import { formatPercent } from '@/utils/formatters'
import { isExecutedOrder } from '../utils'

/**
 * R006: 对敲交易检测
 * 不同账户在短时间窗口内对同一标的进行方向相反、数量相近的已成交交易。
 * 两笔订单都被标记，互相引用为 related_orders。
 */
export const washTradingRule: RuleExecutor = {
  ruleId: 'R006',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const windowMinutes = Number(config.params['time_window_minutes']) || 2
    const qtyDeviationThreshold = Number(config.params['quantity_deviation_threshold']) || 0.05
    const minAmountHK = Number(config.params['min_amount_hk']) || 500_000
    const minAmountUS = Number(config.params['min_amount_us']) || 100_000
    const flags: RiskFlag[] = []
    const flaggedPairs = new Set<string>()

    const executedOrders = orders.filter(isExecutedOrder)

    const bySymbol = new Map<string, Order[]>()
    for (const order of executedOrders) {
      const list = bySymbol.get(order.symbol) ?? []
      list.push(order)
      bySymbol.set(order.symbol, list)
    }

    for (const [symbol, symbolOrders] of bySymbol) {
      for (let i = 0; i < symbolOrders.length; i++) {
        for (let j = i + 1; j < symbolOrders.length; j++) {
          const a = symbolOrders[i]
          const b = symbolOrders[j]

          if (a.account_id === b.account_id) continue
          if (a.side === b.side) continue

          const minAmount = a.market === 'HK' ? minAmountHK : minAmountUS
          if (a.order_amount < minAmount || b.order_amount < minAmount) continue

          const timeDiff = minutesDiff(a.order_time, b.order_time)
          if (timeDiff > windowMinutes) continue

          const maxQty = Math.max(a.order_quantity, b.order_quantity)
          if (maxQty === 0) continue
          const qtyDeviation = Math.abs(a.order_quantity - b.order_quantity) / maxQty
          if (qtyDeviation > qtyDeviationThreshold) continue

          const pairKey = [a.order_id, b.order_id].sort().join('-')
          if (flaggedPairs.has(pairKey)) continue
          flaggedPairs.add(pairKey)

          const desc = `标的 ${symbol} 疑似对敲: 账户 ${a.account_id}(${a.side} ${a.order_quantity}) 与 账户 ${b.account_id}(${b.side} ${b.order_quantity})，时间差 ${timeDiff.toFixed(1)} 分钟，数量偏差 ${formatPercent(qtyDeviation)}`

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
