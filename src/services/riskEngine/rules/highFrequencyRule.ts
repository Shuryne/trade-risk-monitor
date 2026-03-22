import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import dayjs from 'dayjs'

/** R002: 高频交易检测 — 同一账户在 N 分钟内下单次数超过阈值 */
export const highFrequencyRule: RuleExecutor = {
  ruleId: 'R002',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const windowMinutes = Number(config.params['time_window_minutes']) || 5
    const countThreshold = Number(config.params['order_count_threshold']) || 10
    const flags: RiskFlag[] = []
    const flaggedOrderIds = new Set<string>()

    // 按账户分组
    const byAccount = new Map<string, Order[]>()
    for (const order of orders) {
      const list = byAccount.get(order.account_id) ?? []
      list.push(order)
      byAccount.set(order.account_id, list)
    }

    for (const [accountId, accountOrders] of byAccount) {
      if (accountOrders.length < countThreshold) continue

      // 按时间排序
      const sorted = [...accountOrders].sort((a, b) => dayjs(a.order_time).valueOf() - dayjs(b.order_time).valueOf())

      // 滑动窗口 — 双指针
      let left = 0
      for (let right = 0; right < sorted.length; right++) {
        while (left < right && dayjs(sorted[right].order_time).diff(dayjs(sorted[left].order_time), 'minute', true) > windowMinutes) {
          left++
        }
        const windowSize = right - left + 1
        if (windowSize >= countThreshold) {
          // 标记窗口内所有订单
          for (let j = left; j <= right; j++) {
            if (!flaggedOrderIds.has(sorted[j].order_id)) {
              flaggedOrderIds.add(sorted[j].order_id)
              flags.push({
                rule_id: config.rule_id,
                rule_name: config.name,
                severity: config.severity,
                description: `账户 ${accountId} 在 ${windowMinutes} 分钟内下单 ${windowSize} 笔`,
                related_orders: [sorted[j].order_id],
              })
            }
          }
        }
      }
    }

    return flags
  },
}
