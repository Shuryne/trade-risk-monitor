import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RiskResult } from '@/types/risk'

const COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f97316',
  LOW: '#eab308',
}

const LABELS: Record<string, string> = {
  HIGH: '高风险',
  MEDIUM: '中风险',
  LOW: '低风险',
}

interface RiskLevelChartProps {
  results: RiskResult[];
}

export function RiskLevelChart({ results }: RiskLevelChartProps) {
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const r of results) {
    counts[r.highest_severity]++
  }

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: LABELS[key], value, severity: key }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">风险等级分布</CardTitle></CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">无风险订单</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-sm">风险等级分布</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {data.map(entry => (
                <Cell key={entry.severity} fill={COLORS[entry.severity]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
