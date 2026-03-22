import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RiskBadge } from '@/components/shared/RiskBadge'
import type { RiskResult } from '@/types/risk'
import type { RuleSeverity } from '@/types/rule'
import { SEVERITY_WEIGHT } from '@/utils/constants'

interface TopAccountsTableProps {
  results: RiskResult[];
}

export function TopAccountsTable({ results }: TopAccountsTableProps) {
  // 按账户汇总风险次数和最高等级
  const accountMap = new Map<string, { count: number; highestSeverity: RuleSeverity }>()

  for (const r of results) {
    const acc = r.order.account_id
    const existing = accountMap.get(acc) ?? { count: 0, highestSeverity: 'LOW' as RuleSeverity }
    existing.count++
    if ((SEVERITY_WEIGHT[r.highest_severity] ?? 0) > (SEVERITY_WEIGHT[existing.highestSeverity] ?? 0)) {
      existing.highestSeverity = r.highest_severity
    }
    accountMap.set(acc, existing)
  }

  const top10 = [...accountMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-sm">高风险账户排名（Top 10）</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排名</TableHead>
              <TableHead>账户</TableHead>
              <TableHead className="text-right">风险次数</TableHead>
              <TableHead>最高等级</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top10.map(([accountId, { count, highestSeverity }], i) => (
              <TableRow key={accountId}>
                <TableCell className="font-mono">{i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{accountId}</TableCell>
                <TableCell className="text-right tabular-nums">{count}</TableCell>
                <TableCell><RiskBadge severity={highestSeverity} /></TableCell>
              </TableRow>
            ))}
            {top10.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  无风险账户
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
