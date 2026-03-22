import type { Order } from '@/types/order'
import type { RuleConfig, RuleId } from '@/types/rule'
import type { RiskFlag } from '@/types/risk'

/** 规则执行器统一接口 */
export interface RuleExecutor {
  ruleId: RuleId;
  execute(orders: Order[], config: RuleConfig): RiskFlag[];
}

/** 引擎预处理后的分组数据 */
export interface GroupedOrders {
  byAccount: Map<string, Order[]>;
  bySymbol: Map<string, Order[]>;
  byMarket: Map<string, Order[]>;
  /** 按市场+标的的双层分组 */
  byMarketSymbol: Map<string, Map<string, Order[]>>;
  /** 按市场+账户的双层分组 */
  byMarketAccount: Map<string, Map<string, Order[]>>;
}
