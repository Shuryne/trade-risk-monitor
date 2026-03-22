import Papa from 'papaparse'
import type { Order, RawCsvRow, ParseError, DataSummary, Market, Currency, OrderStatus } from '@/types/order'
import { COLUMN_MAPPING, NUMERIC_FIELDS } from '@/utils/constants'
import { validateHeaders, validateRow } from '@/utils/validators'
import { parseAndConvertToHKT } from '@/utils/timezone'

export interface CsvParseResult {
  orders: Order[];
  errors: ParseError[];
  summary: DataSummary;
}

/**
 * 完整的 CSV 解析管线：
 * 1. BOM 移除
 * 2. Papa Parse 解析
 * 3. 表头校验
 * 4. 字段映射（繁中 → 英文）
 * 5. 数据清洗（引号、千分位、空值）
 * 6. 时区转换
 * 7. 计算字段
 * 8. 逐行校验
 */
export function parseCsv(fileContent: string): CsvParseResult {
  // 1. 移除 BOM
  const cleaned = removeBOM(fileContent)

  // 2. Papa Parse
  const parsed = Papa.parse<RawCsvRow>(cleaned, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // 保持 string，由我们控制转换
  })

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return {
      orders: [],
      errors: parsed.errors.map((e, i) => ({
        row: e.row ?? i,
        column: '',
        message: `CSV 解析错误: ${e.message}`,
      })),
      summary: emptySummary(),
    }
  }

  // 3. 表头校验
  const headers = parsed.meta.fields ?? []
  const missingHeaders = validateHeaders(headers)
  if (missingHeaders.length > 0) {
    return {
      orders: [],
      errors: [{ row: 0, column: '', message: `缺少必需的列: ${missingHeaders.join(', ')}` }],
      summary: emptySummary(),
    }
  }

  const allErrors: ParseError[] = []
  const orders: Order[] = []

  for (let i = 0; i < parsed.data.length; i++) {
    const rawRow = parsed.data[i]
    const rowIndex = i + 2 // +1 for 0-based, +1 for header row

    // 4. 字段映射
    const mapped = mapFields(rawRow)

    // 5. 数据清洗
    cleanOrderId(mapped)
    cleanNumericFields(mapped)
    cleanEmptyValues(mapped)

    // 8. 逐行校验（在清洗后、转换前）
    const rowErrors = validateRow(mapped, rowIndex)
    if (rowErrors.length > 0) {
      allErrors.push(...rowErrors)
      continue // 跳过有错误的行
    }

    // 6. 时区转换
    try {
      const { hktTime, originalTz } = parseAndConvertToHKT(mapped['order_time'])
      mapped['order_time'] = hktTime
      mapped['_original_tz'] = originalTz
    } catch {
      allErrors.push({ row: rowIndex, column: 'order_time', message: `时间解析失败: "${mapped['order_time']}"` })
      continue
    }

    // 7. 构建 Order 对象（含计算字段）
    const order = buildOrder(mapped)
    orders.push(order)
  }

  return {
    orders,
    errors: allErrors,
    summary: buildSummary(orders),
  }
}

/**
 * 读取 File 对象并检测编码（UTF-8 / GBK）。
 */
export async function readFileContent(file: File): Promise<string> {
  // 先尝试 UTF-8
  const utf8Text = await file.text()

  // 检查是否有明显乱码：如果 UTF-8 解码后包含替换字符，尝试 GBK
  if (utf8Text.includes('\uFFFD')) {
    const buffer = await file.arrayBuffer()
    const decoder = new TextDecoder('gbk')
    return decoder.decode(buffer)
  }

  return utf8Text
}

// --- 内部工具函数 ---

function removeBOM(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
}

function mapFields(rawRow: RawCsvRow): Record<string, string> {
  const mapped: Record<string, string> = {}
  for (const [zhKey, enKey] of Object.entries(COLUMN_MAPPING)) {
    const value = (rawRow as Record<string, string>)[zhKey]
    mapped[enKey] = value ?? ''
  }
  return mapped
}

function cleanOrderId(row: Record<string, string>): void {
  // 移除三重引号包裹，提取纯数字
  if (row['order_id']) {
    row['order_id'] = row['order_id'].replace(/^"+|"+$/g, '').trim()
  }
}

function cleanNumericFields(row: Record<string, string>): void {
  for (const field of NUMERIC_FIELDS) {
    if (row[field]) {
      // 移除千分位逗号
      row[field] = row[field].replace(/,/g, '')
    }
  }
}

function cleanEmptyValues(row: Record<string, string>): void {
  for (const key of Object.keys(row)) {
    if (row[key] !== undefined && row[key].trim() === '') {
      row[key] = ''
    }
  }
}

function buildOrder(mapped: Record<string, string>): Order {
  const market = mapped['market'].trim() as Market
  const currency: Currency = market === 'HK' ? 'HKD' : 'USD'
  const orderPrice = parseFloat(mapped['order_price']) || 0
  const orderQuantity = parseFloat(mapped['order_quantity']) || 0
  const filledQuantity = parseFloat(mapped['filled_quantity']) || 0
  const filledAmount = parseFloat(mapped['filled_amount']) || 0

  const orderAmount = orderPrice * orderQuantity
  const filledAvgPrice = filledQuantity > 0 ? filledAmount / filledQuantity : 0

  return {
    order_id: mapped['order_id'],
    seat_number: mapped['seat_number'] || null,
    order_time: mapped['order_time'],
    original_timezone: mapped['_original_tz'] as 'HKT' | 'ET',
    account_id: mapped['account_id'].trim(),
    side: mapped['side'].trim() as Order['side'],
    open_close: mapped['open_close'].trim() as Order['open_close'],
    symbol: mapped['symbol'].trim(),
    order_price: orderPrice,
    order_quantity: orderQuantity,
    remaining_quantity: parseFloat(mapped['remaining_quantity']) || 0,
    filled_quantity: filledQuantity,
    filled_amount: filledAmount,
    order_status: mapped['order_status'].trim() as OrderStatus,
    message: mapped['message'] || null,
    bcan: mapped['bcan'] || null,
    broker_id: mapped['broker_id'].trim(),
    order_type: mapped['order_type'].trim(),
    order_category: mapped['order_category'].trim(),
    asset_type: mapped['asset_type'].trim(),
    market,
    review_time: mapped['review_time'] || null,
    clearing_broker: mapped['clearing_broker'].trim(),
    clearing_account: mapped['clearing_account'].trim(),
    order_amount: orderAmount,
    filled_avg_price: filledAvgPrice,
    currency,
  }
}

function buildSummary(orders: Order[]): DataSummary {
  if (orders.length === 0) return emptySummary()

  const times = orders.map(o => o.order_time).sort()
  const accounts = new Set(orders.map(o => o.account_id))
  const symbols = new Set(orders.map(o => o.symbol))
  const markets = [...new Set(orders.map(o => o.market))] as Market[]

  return {
    totalRows: orders.length,
    timeRange: { start: times[0], end: times[times.length - 1] },
    accountCount: accounts.size,
    symbolCount: symbols.size,
    markets,
  }
}

function emptySummary(): DataSummary {
  return { totalRows: 0, timeRange: null, accountCount: 0, symbolCount: 0, markets: [] }
}
