import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatPercent } from '@/utils/formatters'
import { groupOrdersBy, paramAsNumber } from '../utils'

/** R009: 撤单率异常 — 同一账户当日撤单比例超过阈值（至少 N 笔订单） */
export const cancelRateRule: RuleExecutor = {
  ruleId: 'R009',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const rateThreshold = paramAsNumber(config, 'cancel_rate_threshold', 0.50)
    const minOrderCount = paramAsNumber(config, 'min_order_count', 5)
    const flags: RiskFlag[] = []

    const byAccount = groupOrdersBy(orders, o => o.account_id)

    for (const [accountId, accountOrders] of byAccount) {
      if (accountOrders.length < minOrderCount) continue

      const cancelCount = accountOrders.filter(o => o.order_status === '已撤單').length
      const cancelRate = cancelCount / accountOrders.length

      if (cancelRate >= rateThreshold) {
        // 标记该账户所有撤单订单
        for (const order of accountOrders.filter(o => o.order_status === '已撤單')) {
          flags.push({
            rule_id: config.rule_id,
            rule_name: config.name,
            severity: config.severity,
            description: `账户 ${accountId} 撤单率 ${formatPercent(cancelRate)}（${cancelCount}/${accountOrders.length}），超过阈值 ${formatPercent(rateThreshold)}`,
            related_orders: [order.order_id],
          })
        }
      }
    }

    return flags
  },
}
