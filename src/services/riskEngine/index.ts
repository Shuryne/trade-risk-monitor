import type { Order } from '@/types/order'
import type { RuleConfig } from '@/types/rule'
import type { RiskFlag, RiskResult } from '@/types/risk'
import { getExecutor } from './ruleRegistry'
import { severityWeight } from '@/utils/severity'
import type { RuleSeverity } from '@/types/rule'

/**
 * 风险引擎入口：对所有订单执行已启用的规则，返回风险结果列表。
 *
 * 1. 遍历所有启用的规则配置
 * 2. 对适用的市场进行过滤
 * 3. 执行规则，收集 RiskFlag
 * 4. 按订单汇总 flags，计算最高风险等级
 * 5. 按风险等级排序输出
 */
export function runRiskEngine(orders: Order[], ruleConfigs: RuleConfig[]): RiskResult[] {
  // 收集每条订单的 flags: orderId → RiskFlag[]
  const flagsByOrder = new Map<string, RiskFlag[]>()

  for (const config of ruleConfigs) {
    if (!config.enabled) continue

    const executor = getExecutor(config.rule_id)
    if (!executor) continue

    // 过滤适用的市场
    let applicableOrders = orders
    if (config.applicable_markets && config.applicable_markets.length > 0) {
      applicableOrders = orders.filter(o => config.applicable_markets!.includes(o.market))
    }

    const flags = executor.execute(applicableOrders, config)

    // 将 flags 分配到对应订单
    for (const flag of flags) {
      // related_orders[0] 是触发这个 flag 的主订单
      const primaryOrderId = flag.related_orders?.[0]
      if (!primaryOrderId) continue

      const existing = flagsByOrder.get(primaryOrderId) ?? []
      existing.push(flag)
      flagsByOrder.set(primaryOrderId, existing)
    }
  }

  // 构建 RiskResult 列表
  const orderMap = new Map(orders.map(o => [o.order_id, o]))
  const results: RiskResult[] = []

  for (const [orderId, flags] of flagsByOrder) {
    const order = orderMap.get(orderId)
    if (!order) continue

    // 去重：同一规则对同一订单只保留一条
    const deduped = deduplicateFlags(flags)

    const highestSeverity = getHighestSeverity(deduped)

    results.push({
      order,
      flags: deduped,
      highest_severity: highestSeverity,
      review_status: 'PENDING',
    })
  }

  // 按风险等级降序排序，同等级按时间降序（最近的在前）
  results.sort((a, b) => {
    const d = severityWeight(b.highest_severity) - severityWeight(a.highest_severity)
    return d !== 0 ? d : b.order.order_time.localeCompare(a.order.order_time)
  })

  return results
}

function getHighestSeverity(flags: RiskFlag[]): RuleSeverity {
  let highest: RuleSeverity = 'LOW'
  for (const flag of flags) {
    if (severityWeight(flag.severity) > severityWeight(highest)) {
      highest = flag.severity
    }
  }
  return highest
}

function deduplicateFlags(flags: RiskFlag[]): RiskFlag[] {
  const seen = new Set<string>()
  return flags.filter(f => {
    const key = `${f.rule_id}|${f.description}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
