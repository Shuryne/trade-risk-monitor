import type { RuleSeverity } from '@/types/rule'

interface SeverityStyle {
  label: string
  weight: number
  chartColor: string
  badgeClassName: string
  borderClassName: string
}

export const SEVERITY_CONFIG: Record<RuleSeverity, SeverityStyle> = {
  HIGH: {
    label: '高风险',
    weight: 3,
    chartColor: '#ef4444',
    badgeClassName: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    borderClassName: 'border-l-red-500',
  },
  MEDIUM: {
    label: '中风险',
    weight: 2,
    chartColor: '#f97316',
    badgeClassName: 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    borderClassName: 'border-l-orange-400',
  },
  LOW: {
    label: '低风险',
    weight: 1,
    chartColor: '#eab308',
    badgeClassName: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    borderClassName: 'border-l-yellow-400',
  },
}

export function severityLabel(severity: RuleSeverity): string {
  return SEVERITY_CONFIG[severity].label
}

export function severityWeight(severity: RuleSeverity): number {
  return SEVERITY_CONFIG[severity].weight
}
