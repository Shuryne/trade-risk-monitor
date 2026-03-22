import type { Order, DataSummary } from '@/types/order'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatAmount, formatNumber } from '@/utils/formatters'

interface DataPreviewProps {
  orders: Order[];
  summary: DataSummary;
}

/** 数据预览区（前 10 行）+ 统计摘要 */
export function DataPreview({ orders, summary }: DataPreviewProps) {
  const previewRows = orders.slice(0, 10)

  return (
    <div className="space-y-4">
      {/* 统计摘要 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="总订单数" value={formatNumber(summary.totalRows)} />
        <SummaryCard
          label="时间范围"
          value={summary.timeRange
            ? `${formatDateTime(summary.timeRange.start).slice(0, 10)} ~ ${formatDateTime(summary.timeRange.end).slice(0, 10)}`
            : '-'
          }
        />
        <SummaryCard label="涉及账户" value={formatNumber(summary.accountCount)} />
        <SummaryCard label="涉及标的" value={formatNumber(summary.symbolCount)} />
        <SummaryCard label="涉及市场" value={summary.markets.join(' / ') || '-'} />
      </div>

      {/* 预览表格 */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">数据预览（前 10 行）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">订单编号</TableHead>
                  <TableHead className="whitespace-nowrap">时间(HKT)</TableHead>
                  <TableHead className="whitespace-nowrap">账户</TableHead>
                  <TableHead className="whitespace-nowrap">方向</TableHead>
                  <TableHead className="whitespace-nowrap">标的</TableHead>
                  <TableHead className="whitespace-nowrap text-right">委托价格</TableHead>
                  <TableHead className="whitespace-nowrap text-right">委托数量</TableHead>
                  <TableHead className="whitespace-nowrap text-right">委托金额</TableHead>
                  <TableHead className="whitespace-nowrap">状态</TableHead>
                  <TableHead className="whitespace-nowrap">市场</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map(order => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-mono text-xs">{order.order_id.slice(-8)}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(order.order_time)}</TableCell>
                    <TableCell className="text-xs">{order.account_id}</TableCell>
                    <TableCell className="text-xs">{order.side}</TableCell>
                    <TableCell className="text-xs font-medium">{order.symbol}</TableCell>
                    <TableCell className="text-right text-xs">{order.order_price.toFixed(4)}</TableCell>
                    <TableCell className="text-right text-xs">{formatNumber(order.order_quantity)}</TableCell>
                    <TableCell className="text-right text-xs">{formatAmount(order.order_amount, order.currency)}</TableCell>
                    <TableCell className="text-xs">{order.order_status}</TableCell>
                    <TableCell className="text-xs">{order.market}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold mt-0.5">{value}</p>
      </CardContent>
    </Card>
  )
}
