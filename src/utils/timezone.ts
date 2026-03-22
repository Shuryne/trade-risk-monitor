import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const HKT_TIMEZONE = 'Asia/Hong_Kong'
const ET_TIMEZONE = 'America/New_York'

/**
 * 解析原始时间字符串（格式: "YYYY-MM-DD HH:mm:ss TZ"）并统一转换为 HKT ISO 8601 格式。
 *
 * TZ 可能是 "HKT" 或 "ET"。
 * - HKT: 直接视为 UTC+8
 * - ET: 使用 Day.js timezone 插件正确处理夏令时（EST +13h / EDT +12h）
 *
 * @returns ISO 8601 格式的 HKT 时间字符串，如 "2026-01-26T00:36:13+08:00"
 */
export function parseAndConvertToHKT(rawTime: string): { hktTime: string; originalTz: 'HKT' | 'ET' } {
  const trimmed = rawTime.trim()
  const lastSpace = trimmed.lastIndexOf(' ')
  const tzSuffix = trimmed.slice(lastSpace + 1).toUpperCase()
  const dateTimePart = trimmed.slice(0, lastSpace).trim() // "YYYY-MM-DD HH:mm:ss"

  if (tzSuffix === 'HKT') {
    // 直接视为 HKT (Asia/Hong_Kong)
    const parsed = dayjs.tz(dateTimePart, 'YYYY-MM-DD HH:mm:ss', HKT_TIMEZONE)
    return {
      hktTime: parsed.format('YYYY-MM-DDTHH:mm:ssZ'),
      originalTz: 'HKT',
    }
  }

  if (tzSuffix === 'ET') {
    // 视为 America/New_York（自动处理 EST/EDT 夏令时）
    const parsed = dayjs.tz(dateTimePart, 'YYYY-MM-DD HH:mm:ss', ET_TIMEZONE)
    const hkt = parsed.tz(HKT_TIMEZONE)
    return {
      hktTime: hkt.format('YYYY-MM-DDTHH:mm:ssZ'),
      originalTz: 'ET',
    }
  }

  throw new Error(`Unknown timezone suffix: "${tzSuffix}" in "${rawTime}"`)
}

/**
 * 从 HKT ISO 8601 时间字符串中提取小时数（0-23），用于时间分布图表。
 */
export function getHKTHour(hktIsoTime: string): number {
  return dayjs(hktIsoTime).tz(HKT_TIMEZONE).hour()
}

/**
 * 检查 HKT 时间是否在指定时间之后（用于尾盘检测）。
 */
export function isAfterHKT(hktIsoTime: string, hour: number, minute: number): boolean {
  const d = dayjs(hktIsoTime).tz(HKT_TIMEZONE)
  return d.hour() > hour || (d.hour() === hour && d.minute() >= minute)
}

/**
 * 计算两个 HKT ISO 时间之间的分钟差（绝对值）。
 */
export function minutesDiff(time1: string, time2: string): number {
  return Math.abs(dayjs(time1).diff(dayjs(time2), 'minute', true))
}
