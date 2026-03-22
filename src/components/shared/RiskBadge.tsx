import { Badge } from '@/components/ui/badge'
import type { RuleSeverity } from '@/types/rule'
import { SEVERITY_CONFIG } from '@/utils/severity'

export function RiskBadge({ severity }: { severity: RuleSeverity }) {
  const config = SEVERITY_CONFIG[severity]
  return (
    <Badge variant="secondary" className={config.badgeClassName}>
      {config.label}
    </Badge>
  )
}
