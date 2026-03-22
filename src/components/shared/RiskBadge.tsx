import { Badge } from '@/components/ui/badge'
import type { RuleSeverity } from '@/types/rule'

const severityConfig: Record<RuleSeverity, { label: string; className: string }> = {
  HIGH: { label: '高风险', className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  MEDIUM: { label: '中风险', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
  LOW: { label: '低风险', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

export function RiskBadge({ severity }: { severity: RuleSeverity }) {
  const config = severityConfig[severity]
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}
