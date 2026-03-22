/** 标准化后的订单数据 */
export interface Order {
  // --- 原始字段映射 ---
  order_id: string;
  seat_number: string | null;
  order_time: string; // 已统一为 HKT，ISO 8601 格式
  original_timezone: 'HKT' | 'ET';
  account_id: string;
  side: '買入' | '賣出';
  open_close: '開倉' | '平倉';
  symbol: string;
  order_price: number;
  order_quantity: number;
  remaining_quantity: number;
  filled_quantity: number;
  filled_amount: number;
  order_status: OrderStatus;
  message: string | null;
  bcan: string | null;
  broker_id: string;
  order_type: string;
  order_category: string;
  asset_type: string;
  market: Market;
  review_time: string | null;
  clearing_broker: string;
  clearing_account: string;

  // --- 计算字段 ---
  order_amount: number; // order_price × order_quantity
  filled_avg_price: number; // filled_amount / filled_quantity（未成交为 0）
  currency: Currency;
}

export type OrderStatus =
  | '成交' | '已拒絕' | '已過期' | '已撤單' | '部分成交'
  | '已委託' | '部成部撤' | '待報' | '待報（條件單）' | '待報（保價）';
export type Market = 'HK' | 'US';
export type Currency = 'HKD' | 'USD';

/** 原始 CSV 行（解析前，繁体中文表头） */
export interface RawCsvRow {
  '編號': string;
  '席位號': string;
  '創建時間': string;
  '證券賬戶': string;
  '買賣方向': string;
  '開平方向': string;
  '證券代碼': string;
  '委託價格': string;
  '委託數量': string;
  '剩餘未成交數量': string;
  '已成交數量': string;
  '已成交金額': string;
  '訂單狀態': string;
  '信息': string;
  'BCAN': string;
  '經紀人號': string;
  '訂單類型': string;
  '訂單種類': string;
  '資產屬性': string;
  '市場': string;
  '覆盤時間': string;
  '上手經紀商': string;
  '上手賬號': string;
}

/** 数据统计摘要 */
export interface DataSummary {
  totalRows: number;
  timeRange: { start: string; end: string } | null;
  accountCount: number;
  symbolCount: number;
  markets: Market[];
}

/** CSV 解析错误 */
export interface ParseError {
  row: number;
  column: string;
  message: string;
}
