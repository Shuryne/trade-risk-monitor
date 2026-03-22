import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RiskResult } from '@/types/risk'

interface RiskTypeChartProps {
  results: RiskResult[];
}

export function RiskTypeChart({ results }: RiskTypeChartProps) {
  // 按规则 ID 统计触发次数
  const ruleCountMap = new Map<string, { name: string; count: number }>()
  for (const r of results) {
    for (const flag of r.flags) {
      const existing = ruleCountMap.get(flag.rule_id) ?? { name: flag.rule_name, count: 0 }
      existing.count++
      ruleCountMap.set(flag.rule_id, existing)
    }
  }

  const data = [...ruleCountMap.entries()]
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-sm">风险类型分布</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="触发次数" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
