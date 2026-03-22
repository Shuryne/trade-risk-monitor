import type { RuleExecutor } from './types'
import { largeOrderRule } from './rules/largeOrderRule'
import { highFrequencyRule } from './rules/highFrequencyRule'
import { accountConcentrationRule } from './rules/accountConcentration'
import { symbolConcentrationRule } from './rules/symbolConcentration'
import { priceDeviationRule } from './rules/priceDeviation'
import { washTradingRule } from './rules/washTrading'
import { lateTradingRule } from './rules/lateTrading'
import { pennyStockRule } from './rules/pennyStock'
import { cancelRateRule } from './rules/cancelRate'
import { selfTradingRule } from './rules/selfTrading'
import { rejectedOrderRule } from './rules/rejectedOrder'

/** 所有已注册的规则执行器 */
const ruleExecutors: RuleExecutor[] = [
  largeOrderRule,      // R001
  highFrequencyRule,   // R002
  accountConcentrationRule, // R003
  symbolConcentrationRule,  // R004
  priceDeviationRule,  // R005
  washTradingRule,     // R006
  lateTradingRule,     // R007
  pennyStockRule,      // R008
  cancelRateRule,      // R009
  selfTradingRule,     // R010
  rejectedOrderRule,   // R011
]

/** 按 ruleId 获取执行器 */
export function getExecutor(ruleId: string): RuleExecutor | undefined {
  return ruleExecutors.find(e => e.ruleId === ruleId)
}

/** 获取所有执行器 */
export function getAllExecutors(): RuleExecutor[] {
  return ruleExecutors
}
