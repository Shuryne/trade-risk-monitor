import type { Market } from './order'

export type RuleSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type RuleId = 'R001' | 'R002' | 'R003' | 'R004' | 'R005' | 'R006' | 'R007' | 'R008' | 'R009' | 'R010' | 'R011';

/** 规则配置 */
export interface RuleConfig {
  rule_id: RuleId;
  name: string;
  description: string;
  enabled: boolean;
  severity: RuleSeverity;
  params: Record<string, number | string>;
  applicable_markets?: Market[];
}
