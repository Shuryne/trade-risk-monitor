import type { Order, Market } from './order'
import type { RuleConfig, RuleSeverity } from './rule'

/** 单条风险标记 */
export interface RiskFlag {
  rule_id: string;
  rule_name: string;
  severity: RuleSeverity;
  description: string;
  related_orders?: string[]; // 关联订单 ID（如对敲检测时的对手方订单）
}

export type ReviewStatus = 'PENDING' | 'REVIEWED' | 'FOLLOW_UP' | 'FALSE_POSITIVE';

/** 风险检测结果（一条订单 + 它触发的所有规则） */
export interface RiskResult {
  order: Order;
  flags: RiskFlag[];
  highest_severity: RuleSeverity;
  review_status: ReviewStatus;
}

/** 分析会话（用于历史记录持久化） */
export interface AnalysisSession {
  id: string;
  date: string;
  created_at: string;
  total_orders: number;
  risk_orders: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  market_breakdown: {
    HK: { total: number; risk: number };
    US: { total: number; risk: number };
  };
  orders: Order[];
  risk_results: RiskResult[];
  rule_config: RuleConfig[];
  // Review tracking (added for detail page redesign)
  notes: Record<string, string>;            // orderId → note text
  reviewTimestamps: Record<string, string>;  // orderId → ISO 8601 timestamp
  firstReviewAt: string | null;
  lastReviewAt: string | null;
}
