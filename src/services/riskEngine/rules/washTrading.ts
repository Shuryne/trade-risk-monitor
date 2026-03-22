import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'
import type { RuleExecutor } from '../types'
import { formatPercent } from '@/utils/formatters'
import { findTradingPairs, paramAsNumber } from '../utils'

/**
 * R006: 对敲交易检测
 * 不同账户在短时间窗口内对同一标的进行方向相反、数量相近的已成交交易。
 * 两笔订单都被标记，互相引用为 related_orders。
 */
export const washTradingRule: RuleExecutor = {
  ruleId: 'R006',
  execute(orders: Order[], config: RuleConfig): RiskFlag[] {
    return findTradingPairs(
      orders,
      config,
      {
        groupKeyFn: o => o.symbol,
        pairFilter: (a, b) => a.account_id !== b.account_id,
        windowMinutes: paramAsNumber(config, 'time_window_minutes', 2),
        qtyDeviationThreshold: paramAsNumber(config, 'quantity_deviation_threshold', 0.05),
        minAmountHK: paramAsNumber(config, 'min_amount_hk', 500_000),
        minAmountUS: paramAsNumber(config, 'min_amount_us', 100_000),
      },
      (a, b, timeDiff, qtyDeviation, symbol) =>
        `标的 ${symbol} 疑似对敲: 账户 ${a.account_id}(${a.side} ${a.order_quantity}) 与 账户 ${b.account_id}(${b.side} ${b.order_quantity})，时间差 ${timeDiff.toFixed(1)} 分钟，数量偏差 ${formatPercent(qtyDeviation)}`,
    )
  },
}
