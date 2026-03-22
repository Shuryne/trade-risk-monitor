import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'

/** R011: 被拒订单关注 — 标记所有被拒绝的订单，附带拒绝原因 */
export const rejectedOrderRule: RuleExecutor = {
  ruleId: 'R011',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const flags: RiskFlag[] = []

    for (const order of orders) {
      if (order.order_status !== '已拒絕') continue

      flags.push({
        rule_id: config.rule_id,
        rule_name: config.name,
        severity: config.severity,
        description: `订单被拒绝${order.message ? `，原因: ${order.message}` : ''}`,
        related_orders: [order.order_id],
      })
    }

    return flags
  },
}
