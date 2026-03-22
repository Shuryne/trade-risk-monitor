import type { RuleConfig } from '@/types/rule'

/** 繁体中文 CSV 列名 → 英文字段名映射 */
export const COLUMN_MAPPING: Record<string, string> = {
  '編號': 'order_id',
  '席位號': 'seat_number',
  '創建時間': 'order_time',
  '證券賬戶': 'account_id',
  '買賣方向': 'side',
  '開平方向': 'open_close',
  '證券代碼': 'symbol',
  '委託價格': 'order_price',
  '委託數量': 'order_quantity',
  '剩餘未成交數量': 'remaining_quantity',
  '已成交數量': 'filled_quantity',
  '已成交金額': 'filled_amount',
  '訂單狀態': 'order_status',
  '信息': 'message',
  'BCAN': 'bcan',
  '經紀人號': 'broker_id',
  '訂單類型': 'order_type',
  '訂單種類': 'order_category',
  '資產屬性': 'asset_type',
  '市場': 'market',
  '覆盤時間': 'review_time',
  '上手經紀商': 'clearing_broker',
  '上手賬號': 'clearing_account',
} as const;

/** 必填字段列表（英文键名） */
export const REQUIRED_FIELDS = [
  'order_id',
  'order_time',
  'account_id',
  'side',
  'symbol',
  'order_price',
  'order_quantity',
  'order_status',
  'market',
] as const;

/** 数字类型字段（需要移除千分位逗号并转为 number） */
export const NUMERIC_FIELDS = [
  'order_price',
  'order_quantity',
  'remaining_quantity',
  'filled_quantity',
  'filled_amount',
] as const;

/** 合法的订单状态值 */
export const VALID_ORDER_STATUSES = [
  '成交', '已拒絕', '已過期', '已撤單', '部分成交',
  '已委託', '部成部撤', '待報', '待報（條件單）', '待報（保價）',
] as const;

/** 合法的交易方向 */
export const VALID_SIDES = ['買入', '賣出'] as const;

/** 合法的开平方向 */
export const VALID_OPEN_CLOSE = ['開倉', '平倉'] as const;

/** 合法的市场 */
export const VALID_MARKETS = ['HK', 'US'] as const;

/** 风险等级排序权重（越高越严重） */
export const SEVERITY_WEIGHT: Record<string, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/** 11 条默认规则配置 */
export const DEFAULT_RULE_CONFIGS: RuleConfig[] = [
  {
    rule_id: 'R001',
    name: '大额交易检测',
    description: '单笔委托金额超过阈值',
    enabled: true,
    severity: 'HIGH',
    params: {
      threshold_hk: 5_000_000,
      threshold_us: 1_000_000,
    },
  },
  {
    rule_id: 'R002',
    name: '高频交易检测',
    description: '同一账户在短时间内下单次数超过阈值',
    enabled: true,
    severity: 'MEDIUM',
    params: {
      time_window_minutes: 5,
      order_count_threshold: 20,
    },
  },
  {
    rule_id: 'R003',
    name: '单账户集中度',
    description: '单一账户已成交金额占比超过阈值（按市场分别计算）',
    enabled: true,
    severity: 'MEDIUM',
    params: {
      concentration_threshold: 0.35,
    },
  },
  {
    rule_id: 'R004',
    name: '单标的集中度',
    description: '单一标的已成交金额占比超过阈值（按市场分别计算）',
    enabled: true,
    severity: 'MEDIUM',
    params: {
      concentration_threshold: 0.40,
    },
  },
  {
    rule_id: 'R005',
    name: '成交价格偏离',
    description: '成交均价偏离委托价格的幅度超过阈值',
    enabled: true,
    severity: 'HIGH',
    params: {
      deviation_threshold: 0.05,
    },
  },
  {
    rule_id: 'R006',
    name: '对敲交易检测',
    description: '不同账户在短时间内对同一标的进行方向相反、数量相近的已成交交易',
    enabled: true,
    severity: 'HIGH',
    params: {
      time_window_minutes: 2,
      quantity_deviation_threshold: 0.05,
      min_amount_hk: 500_000,
      min_amount_us: 100_000,
    },
  },
  {
    rule_id: 'R007',
    name: '尾盘异常交易',
    description: '港股收盘前的大额委托',
    enabled: true,
    severity: 'MEDIUM',
    params: {
      late_trading_hour: 15,
      late_trading_minute: 45,
      threshold_hk: 1_000_000,
    },
    applicable_markets: ['HK'],
  },
  {
    rule_id: 'R008',
    name: 'Penny Stock 交易',
    description: '低价股的大额交易',
    enabled: true,
    severity: 'LOW',
    params: {
      price_threshold: 1,
      amount_threshold_hk: 500_000,
    },
    applicable_markets: ['HK'],
  },
  {
    rule_id: 'R009',
    name: '撤单率异常',
    description: '同一账户当日撤单比例超过阈值',
    enabled: true,
    severity: 'MEDIUM',
    params: {
      cancel_rate_threshold: 0.50,
      min_order_count: 10,
    },
  },
  {
    rule_id: 'R010',
    name: '洗售交易检测',
    description: '同一账户在短时间内对同一标的先买后卖（或先卖后买），数量相近的已成交交易',
    enabled: true,
    severity: 'HIGH',
    params: {
      time_window_minutes: 5,
      quantity_deviation_threshold: 0.05,
      min_amount_hk: 200_000,
      min_amount_us: 50_000,
    },
  },
  {
    rule_id: 'R011',
    name: '被拒订单关注',
    description: '标记所有被拒绝的订单，附带拒绝原因供人工审查',
    enabled: true,
    severity: 'LOW',
    params: {},
  },
];
