import type { ParseError } from '@/types/order'
import { REQUIRED_FIELDS, VALID_ORDER_STATUSES, VALID_SIDES, VALID_OPEN_CLOSE, VALID_MARKETS } from './constants'

/**
 * 校验已映射为英文键名的单行数据。
 * 在数据清洗之后、类型转换之后调用。
 *
 * @param row 一行已映射的原始数据（值仍为 string）
 * @param rowIndex 行号（从 1 开始，用于错误报告）
 * @returns 该行的所有校验错误
 */
export function validateRow(row: Record<string, string>, rowIndex: number): ParseError[] {
  const errors: ParseError[] = []

  // 必填字段检查
  for (const field of REQUIRED_FIELDS) {
    const value = row[field]
    if (value === undefined || value === null || value.trim() === '') {
      errors.push({ row: rowIndex, column: field, message: `必填字段 "${field}" 缺失或为空` })
    }
  }

  // 价格：非负数
  const price = row['order_price']
  if (price !== undefined && price.trim() !== '') {
    const parsed = parseFloat(price.replace(/,/g, ''))
    if (isNaN(parsed) || parsed < 0) {
      errors.push({ row: rowIndex, column: 'order_price', message: `委托价格无效: "${price}"` })
    }
  }

  // 数量：非负整数
  const quantity = row['order_quantity']
  if (quantity !== undefined && quantity.trim() !== '') {
    const parsed = parseFloat(quantity.replace(/,/g, ''))
    if (isNaN(parsed) || parsed < 0) {
      errors.push({ row: rowIndex, column: 'order_quantity', message: `委托数量无效: "${quantity}"` })
    }
  }

  // 时间格式检查
  const time = row['order_time']
  if (time !== undefined && time.trim() !== '') {
    const trimmed = time.trim()
    const lastSpace = trimmed.lastIndexOf(' ')
    const tzSuffix = lastSpace >= 0 ? trimmed.slice(lastSpace + 1).toUpperCase() : ''
    if (tzSuffix !== 'HKT' && tzSuffix !== 'ET') {
      errors.push({ row: rowIndex, column: 'order_time', message: `时间格式无效，时区须为 HKT 或 ET: "${time}"` })
    } else {
      const dateTimePart = trimmed.slice(0, lastSpace).trim()
      const dateTimeRegex = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/
      if (!dateTimeRegex.test(dateTimePart)) {
        errors.push({ row: rowIndex, column: 'order_time', message: `时间格式无效: "${time}"` })
      }
    }
  }

  // 枚举值校验
  const status = row['order_status']
  if (status && status.trim() !== '' && !(VALID_ORDER_STATUSES as readonly string[]).includes(status.trim())) {
    errors.push({ row: rowIndex, column: 'order_status', message: `无效的订单状态: "${status}"` })
  }

  const side = row['side']
  if (side && side.trim() !== '' && !(VALID_SIDES as readonly string[]).includes(side.trim())) {
    errors.push({ row: rowIndex, column: 'side', message: `无效的买卖方向: "${side}"` })
  }

  const openClose = row['open_close']
  if (openClose && openClose.trim() !== '' && !(VALID_OPEN_CLOSE as readonly string[]).includes(openClose.trim())) {
    errors.push({ row: rowIndex, column: 'open_close', message: `无效的开平方向: "${openClose}"` })
  }

  const market = row['market']
  if (market && market.trim() !== '' && !(VALID_MARKETS as readonly string[]).includes(market.trim())) {
    errors.push({ row: rowIndex, column: 'market', message: `无效的市场: "${market}"` })
  }

  return errors
}

/**
 * 校验 CSV 表头是否包含所有必需的列。
 *
 * @param headers CSV 解析后的表头列表（繁中原始列名）
 * @returns 缺失列名列表，空数组表示通过
 */
export function validateHeaders(headers: string[]): string[] {
  const requiredChinese = [
    '編號', '創建時間', '證券賬戶', '買賣方向', '證券代碼',
    '委託價格', '委託數量', '訂單狀態', '市場',
  ]
  return requiredChinese.filter(h => !headers.includes(h))
}
