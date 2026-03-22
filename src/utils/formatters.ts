import type { Currency } from '@/types/order'
import type { RuleSeverity } from '@/types/rule'
import dayjs from 'dayjs'

/**
 * 格式化金额（千分位 + 币种符号）
 * e.g. 5000000 + 'HKD' → "HKD 5,000,000.00"
 */
export function formatAmount(amount: number, currency: Currency): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${currency} ${formatted}`
}

/**
 * 格式化数字（千分位）
 * e.g. 10000 → "10,000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * 格式化百分比
 * e.g. 0.256 → "25.60%"
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化 ISO 8601 日期为可读格式
 * e.g. "2026-01-26T00:36:13+08:00" → "2026-01-26 00:36:13"
 */
export function formatDateTime(isoTime: string): string {
  return dayjs(isoTime).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化 ISO 8601 日期为日期部分
 * e.g. "2026-01-26T00:36:13+08:00" → "2026-01-26"
 */
export function formatDate(isoTime: string): string {
  return dayjs(isoTime).format('YYYY-MM-DD')
}

/**
 * 风险等级显示标签（中文）
 */
export function severityLabel(severity: RuleSeverity): string {
  const labels: Record<RuleSeverity, string> = {
    HIGH: '高风险',
    MEDIUM: '中风险',
    LOW: '低风险',
  }
  return labels[severity]
}
