import { useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { ExportButton } from '@/components/shared/ExportButton'
import { useOrderStore } from '@/stores/orderStore'
import { useRiskStore } from '@/stores/riskStore'
import { useRuleConfigStore } from '@/stores/ruleConfigStore'
import { generatePdfReport, exportRiskCsv } from '@/services/reportGenerator'
import { formatDateTime, formatAmount, formatNumber, formatPercent } from '@/utils/formatters'

export default function ReportPage() {
  const { orders, summary } = useOrderStore()
  const { results } = useRiskStore()
  const { configs } = useRuleConfigStore()

  const highCount = results.filter(r => r.highest_severity === 'HIGH').length
  const medCount = results.filter(r => r.highest_severity === 'MEDIUM').length
  const lowCount = results.filter(r => r.highest_severity === 'LOW').length

  const handleExportPdf = useCallback(() => {
    generatePdfReport({ orders, results, ruleConfigs: configs, summary })
  }, [orders, results, configs, summary])

  const handleExportCsv = useCallback(() => {
    exportRiskCsv(results)
  }, [results])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="风险报告"
        description="生成结构化报告供存档和上报"
        actions={
          <div className="flex gap-2">
            <ExportButton label="导出 PDF" onClick={handleExportPdf} disabled={results.length === 0} />
            <ExportButton label="导出 CSV" onClick={handleExportCsv} disabled={results.length === 0} />
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* 报告预览 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">每日交易风险监控报告</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              报告日期: {summary.timeRange?.start?.slice(0, 10) ?? 'N/A'} |
              生成时间: {new Date().toLocaleString('zh-CN')}
            </p>
          </CardHeader>
        </Card>

        {/* 数据概览 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">数据概览</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div><span className="text-muted-foreground">总订单数:</span> {formatNumber(summary.totalRows)}</div>
              <div><span className="text-muted-foreground">涉及账户:</span> {formatNumber(summary.accountCount)}</div>
              <div><span className="text-muted-foreground">涉及标的:</span> {formatNumber(summary.symbolCount)}</div>
              <div><span className="text-muted-foreground">涉及市场:</span> {summary.markets.join(' / ')}</div>
            </div>
          </CardContent>
        </Card>

        {/* 风险摘要 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">风险摘要</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div><span className="text-muted-foreground">风险订单总数:</span> {formatNumber(results.length)}</div>
              <div><span className="text-muted-foreground">风险占比:</span> {summary.totalRows > 0 ? formatPercent(results.length / summary.totalRows) : '0%'}</div>
              <div className="text-red-600">高风险: {highCount}</div>
              <div className="text-orange-600">中风险: {medCount}</div>
              <div className="text-yellow-600">低风险: {lowCount}</div>
            </div>
          </CardContent>
        </Card>

        {/* 风险订单明细 */}
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">风险订单明细</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">风险等级</TableHead>
                    <TableHead className="text-xs">时间</TableHead>
                    <TableHead className="text-xs">账户</TableHead>
                    <TableHead className="text-xs">标的</TableHead>
                    <TableHead className="text-xs">方向</TableHead>
                    <TableHead className="text-xs text-right">委托金额</TableHead>
                    <TableHead className="text-xs">市场</TableHead>
                    <TableHead className="text-xs">触发规则</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(r => (
                    <TableRow key={r.order.order_id}>
                      <TableCell><RiskBadge severity={r.highest_severity} /></TableCell>
                      <TableCell className="text-xs">{formatDateTime(r.order.order_time)}</TableCell>
                      <TableCell className="text-xs font-mono">{r.order.account_id}</TableCell>
                      <TableCell className="text-xs">{r.order.symbol}</TableCell>
                      <TableCell className="text-xs">{r.order.side}</TableCell>
                      <TableCell className="text-xs text-right">{formatAmount(r.order.order_amount, r.order.currency)}</TableCell>
                      <TableCell className="text-xs">{r.order.market}</TableCell>
                      <TableCell className="text-xs">{r.flags.map(f => f.rule_name).join(', ')}</TableCell>
                    </TableRow>
                  ))}
                  {results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        暂无风险订单
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
