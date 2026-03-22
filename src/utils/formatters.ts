import type { Currency } from '@/types/order'
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

export { severityLabel } from './severity'

/** 买卖方向对应的颜色 class */
export function sideColorClass(side: string): string {
  return side === '買入'
    ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
    : 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
}
