import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { storageService } from '@/services/storageService'
import { useOrderStore } from '@/stores/orderStore'
import { useRiskStore } from '@/stores/riskStore'
import type { AnalysisSession } from '@/types/risk'
import { formatNumber } from '@/utils/formatters'
import { Eye, Trash2 } from 'lucide-react'

export default function HistoryPage() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [storageUsed, setStorageUsed] = useState(0)
  const navigate = useNavigate()

  const loadSessions = useCallback(async () => {
    const all = await storageService.getAllSessions()
    setSessions(all)
    const usage = await storageService.estimateStorage()
    setStorageUsed(usage)
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  const handleView = useCallback(async (session: AnalysisSession) => {
    // 将历史数据加载到 stores
    useOrderStore.setState({
      orders: session.orders,
      summary: {
        totalRows: session.total_orders,
        timeRange: session.orders.length > 0
          ? { start: session.orders[0].order_time, end: session.orders[session.orders.length - 1].order_time }
          : null,
        accountCount: new Set(session.orders.map(o => o.account_id)).size,
        symbolCount: new Set(session.orders.map(o => o.symbol)).size,
        markets: [...new Set(session.orders.map(o => o.market))],
      },
      hasData: true,
      parseErrors: [],
      isLoading: false,
    })
    useRiskStore.setState({
      results: session.risk_results,
      hasResults: true,
      notes: session.notes ?? {},
      reviewTimestamps: session.reviewTimestamps ?? {},
      firstReviewAt: session.firstReviewAt ?? null,
      lastReviewAt: session.lastReviewAt ?? null,
    })
    navigate('/dashboard')
  }, [navigate])

  const handleDelete = useCallback(async (id: string) => {
    await storageService.deleteSession(id)
    loadSessions()
  }, [loadSessions])

  return (
    <div className="flex flex-col h-full">
      <Header title="历史记录" description="查看过去的分析结果" />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">
              存储使用量: {(storageUsed / 1024 / 1024).toFixed(2)} MB |
              历史记录: {sessions.length} 条
            </p>
          </CardContent>
        </Card>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分析日期</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">总订单</TableHead>
                <TableHead className="text-right">风险订单</TableHead>
                <TableHead className="text-right">高风险</TableHead>
                <TableHead className="text-right">中风险</TableHead>
                <TableHead className="text-right">低风险</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无历史记录
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map(session => (
                  <TableRow key={session.id}>
                    <TableCell className="text-sm">{session.date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{session.created_at.slice(0, 19)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(session.total_orders)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(session.risk_orders)}</TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">{session.high_risk_count}</TableCell>
                    <TableCell className="text-right tabular-nums text-orange-600">{session.medium_risk_count}</TableCell>
                    <TableCell className="text-right tabular-nums text-yellow-600">{session.low_risk_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => handleView(session)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleDelete(session.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
