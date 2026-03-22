import type { Order } from '@/types/order'
import type { OrderStatus } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import { minutesDiff } from '@/utils/timezone'

const EXECUTED_STATUSES: readonly OrderStatus[] = ['成交', '部分成交']

export function isExecutedOrder(order: Order): boolean {
  return (EXECUTED_STATUSES as readonly string[]).includes(order.order_status)
}

/** 按指定键函数对订单分组 */
export function groupOrdersBy(orders: Order[], keyFn: (o: Order) => string): Map<string, Order[]> {
  const map = new Map<string, Order[]>()
  for (const order of orders) {
    const key = keyFn(order)
    const list = map.get(key) ?? []
    list.push(order)
    map.set(key, list)
  }
  return map
}

/** 安全提取数值参数，fallback 不会被 0 值覆盖 */
export function paramAsNumber(config: RuleConfig, key: string, fallback: number): number {
  const val = config.params[key]
  if (val === undefined || val === '') return fallback
  const num = Number(val)
  return Number.isNaN(num) ? fallback : num
}

/** 配对匹配配置 */
export interface PairMatchConfig {
  groupKeyFn: (o: Order) => string
  pairFilter: (a: Order, b: Order) => boolean
  windowMinutes: number
  qtyDeviationThreshold: number
  minAmountHK: number
  minAmountUS: number
}

/**
 * 通用配对交易检测：��分组内查找方向相反、数量相近、时间接近的已成交订单对。
 * 用于 R006（对敲交易）和 R010（洗售交易）。
 */
export function findTradingPairs(
  orders: Order[],
  config: RuleConfig,
  matchConfig: PairMatchConfig,
  descriptionFn: (a: Order, b: Order, timeDiff: number, qtyDeviation: number, groupKey: string) => string,
): RiskFlag[] {
  const flags: RiskFlag[] = []
  const flaggedPairs = new Set<string>()

  const executedOrders = orders.filter(isExecutedOrder)
  const groups = groupOrdersBy(executedOrders, matchConfig.groupKeyFn)

  for (const [groupKey, groupOrders] of groups) {
    if (groupOrders.length < 2) continue

    for (let i = 0; i < groupOrders.length; i++) {
      for (let j = i + 1; j < groupOrders.length; j++) {
        const a = groupOrders[i]
        const b = groupOrders[j]

        if (!matchConfig.pairFilter(a, b)) continue
        if (a.side === b.side) continue

        const minAmount = a.market === 'HK' ? matchConfig.minAmountHK : matchConfig.minAmountUS
        if (a.order_amount < minAmount || b.order_amount < minAmount) continue

        const timeDiff = minutesDiff(a.order_time, b.order_time)
        if (timeDiff > matchConfig.windowMinutes) continue

        const maxQty = Math.max(a.order_quantity, b.order_quantity)
        if (maxQty === 0) continue
        const qtyDeviation = Math.abs(a.order_quantity - b.order_quantity) / maxQty
        if (qtyDeviation > matchConfig.qtyDeviationThreshold) continue

        const pairKey = [a.order_id, b.order_id].sort().join('-')
        if (flaggedPairs.has(pairKey)) continue
        flaggedPairs.add(pairKey)

        const desc = descriptionFn(a, b, timeDiff, qtyDeviation, groupKey)

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
}
