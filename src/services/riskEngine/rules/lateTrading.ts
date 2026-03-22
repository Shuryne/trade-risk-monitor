import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { isAfterHKT } from '@/utils/timezone'
import { formatAmount } from '@/utils/formatters'

/** R007: 尾盘异常交易 — 港股收盘前 N 分钟内的大额委托（仅 HK 市场） */
export const lateTradingRule: RuleExecutor = {
  ruleId: 'R007',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    const hour = Number(config.params['late_trading_hour']) || 15
    const minute = Number(config.params['late_trading_minute']) || 45
    const thresholdHK = Number(config.params['threshold_hk']) || 1_000_000
    const flags: RiskFlag[] = []

    for (const order of orders) {
      if (order.market !== 'HK') continue
      if (!isAfterHKT(order.order_time, hour, minute)) continue
      if (order.order_amount < thresholdHK) continue

      flags.push({
        rule_id: config.rule_id,
        rule_name: config.name,
        severity: config.severity,
        description: `尾盘大额委托: ${formatAmount(order.order_amount, 'HKD')}，下单时间在 ${hour}:${String(minute).padStart(2, '0')} HKT 之后`,
        related_orders: [order.order_id],
      })
    }

    return flags
  },
}
