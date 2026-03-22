import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend, AreaChart, Area } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { storageService } from '@/services/storageService'
import type { AnalysisSession } from '@/types/risk'

export default function TrendPage() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([])

  const load = useCallback(async () => {
    const all = await storageService.getAllSessions()
    // 按日期升序
    setSessions(all.sort((a, b) => a.date.localeCompare(b.date)))
  }, [])

  useEffect(() => { load() }, [load])

  if (sessions.length < 2) {
    return (
      <div className="flex flex-col h-full">
        <Header title="趋势分析" description="基于历史数据的风险趋势" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            需要至少 2 天的历史数据才能展示趋势。当前有 {sessions.length} 条记录。
          </p>
        </div>
      </div>
    )
  }

  // 每日风险订单数量
  const dailyData = sessions.map(s => ({
    date: s.date,
    total: s.total_orders,
    risk: s.risk_orders,
    high: s.high_risk_count,
    medium: s.medium_risk_count,
    low: s.low_risk_count,
  }))

  // 各规则触发频次
  const ruleFreqByDate = sessions.map(s => {
    const ruleCounts: Record<string, number> = {}
    for (const r of s.risk_results) {
      for (const f of r.flags) {
        ruleCounts[f.rule_id] = (ruleCounts[f.rule_id] ?? 0) + 1
      }
    }
    return { date: s.date, ...ruleCounts }
  })

  const allRuleIds = [...new Set(sessions.flatMap(s => s.risk_results.flatMap(r => r.flags.map(f => f.rule_id))))]

  // 高频风险账户排名（近 30 日累计）
  const accountCounts = new Map<string, number>()
  for (const s of sessions) {
    for (const r of s.risk_results) {
      accountCounts.set(r.order.account_id, (accountCounts.get(r.order.account_id) ?? 0) + 1)
    }
  }
  const topAccounts = [...accountCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const ruleColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#a855f7']

  return (
    <div className="flex flex-col h-full">
      <Header title="趋势分析" description="基于历史数据的风险趋势" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* 每日风险订单趋势 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">每日风险订单趋势</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="总订单" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="risk" name="风险订单" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 风险类型触发频次堆叠面积图 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">风险类型触发频次趋势</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={ruleFreqByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {allRuleIds.map((ruleId, i) => (
                  <Area
                    key={ruleId}
                    type="monotone"
                    dataKey={ruleId}
                    name={ruleId}
                    stackId="1"
                    fill={ruleColors[i % ruleColors.length]}
                    stroke={ruleColors[i % ruleColors.length]}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 高频风险账户排名 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">高频风险账户排名（累计）</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>账户</TableHead>
                  <TableHead className="text-right">累计风险次数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAccounts.map(([accountId, count], i) => (
                  <TableRow key={accountId}>
                    <TableCell className="font-mono">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{accountId}</TableCell>
                    <TableCell className="text-right tabular-nums">{count}</TableCell>
                  </TableRow>
                ))}
                {topAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                      无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
