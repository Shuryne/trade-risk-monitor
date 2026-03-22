import type { Market } from './order'

export type RuleSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

/** 规则配置 */
export interface RuleConfig {
  rule_id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: RuleSeverity;
  params: Record<string, number | string>;
  applicable_markets?: Market[];
}
