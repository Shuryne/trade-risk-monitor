import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatPercent } from '@/utils/formatters'
import { findTradingPairs, paramAsNumber } from '../utils'

/**
 * R010: 洗售交易检测
 * 同一账户在短时间内对同一标的先买后卖（或先卖后买），数量相近的已成交交易。
 */
export const selfTradingRule: RuleExecutor = {
  ruleId: 'R010',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    return findTradingPairs(
      orders,
      config,
      {
        groupKeyFn: o => `${o.account_id}|${o.symbol}`,
        pairFilter: () => true,
        windowMinutes: paramAsNumber(config, 'time_window_minutes', 5),
        qtyDeviationThreshold: paramAsNumber(config, 'quantity_deviation_threshold', 0.05),
        minAmountHK: paramAsNumber(config, 'min_amount_hk', 200_000),
        minAmountUS: paramAsNumber(config, 'min_amount_us', 50_000),
      },
      (a, b, timeDiff, qtyDeviation, groupKey) => {
        const [accountId, symbol] = groupKey.split('|')
        return `账户 ${accountId} 疑似洗售: ${symbol} ${a.side} ${a.order_quantity} 与 ${b.side} ${b.order_quantity}，时间差 ${timeDiff.toFixed(1)} 分钟，数量偏差 ${formatPercent(qtyDeviation)}`
      },
    )
  },
}
