import type { RiskResult } from '@/types/risk'
import type { Order } from '@/types/order'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { Separator } from '@/components/ui/separator'
import { formatDateTime, formatAmount, formatNumber } from '@/utils/formatters'
import { useOrderStore } from '@/stores/orderStore'
import { useMemo } from 'react'

interface OrderDetailPanelProps {
  result: RiskResult;
}

export function OrderDetailPanel({ result }: OrderDetailPanelProps) {
  const allOrders = useOrderStore(s => s.orders)

  const sameAccountOrders = useMemo(
    () => allOrders.filter(o => o.account_id === result.order.account_id),
    [allOrders, result.order.account_id]
  )

  const sameSymbolOrders = useMemo(
    () => allOrders.filter(o => o.symbol === result.order.symbol),
    [allOrders, result.order.symbol]
  )

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      {/* 触发的规则 */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-xs">触发的风险规则（{result.flags.length} 条）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>规则</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.flags.map((flag, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{flag.rule_id} {flag.rule_name}</TableCell>
                  <TableCell><RiskBadge severity={flag.severity} /></TableCell>
                  <TableCell className="text-xs max-w-md">{flag.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 信息/拒绝原因 */}
      {result.order.message && (
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">订单信息</p>
            <p className="text-sm mt-1">{result.order.message}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* 同账户交易 */}
      <div>
        <h4 className="text-xs font-medium mb-2">
          同账户（{result.order.account_id}）当日交易（{sameAccountOrders.length} 笔）
        </h4>
        <MiniOrderTable orders={sameAccountOrders} highlightId={result.order.order_id} />
      </div>

      <Separator />

      {/* 同标的交易 */}
      <div>
        <h4 className="text-xs font-medium mb-2">
          同标的（{result.order.symbol}）当日交易（{sameSymbolOrders.length} 笔）
        </h4>
        <MiniOrderTable orders={sameSymbolOrders} highlightId={result.order.order_id} />
      </div>
    </div>
  )
}

function MiniOrderTable({ orders, highlightId }: { orders: Order[]; highlightId: string }) {
  return (
    <div className="max-h-48 overflow-auto rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">时间</TableHead>
            <TableHead className="text-xs">账户</TableHead>
            <TableHead className="text-xs">方向</TableHead>
            <TableHead className="text-xs">标的</TableHead>
            <TableHead className="text-xs text-right">数量</TableHead>
            <TableHead className="text-xs text-right">金额</TableHead>
            <TableHead className="text-xs">状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(o => (
            <TableRow key={o.order_id} className={o.order_id === highlightId ? 'bg-primary/5' : ''}>
              <TableCell className="text-xs">{formatDateTime(o.order_time)}</TableCell>
              <TableCell className="text-xs">{o.account_id}</TableCell>
              <TableCell className="text-xs">{o.side}</TableCell>
              <TableCell className="text-xs font-medium">{o.symbol}</TableCell>
              <TableCell className="text-xs text-right">{formatNumber(o.order_quantity)}</TableCell>
              <TableCell className="text-xs text-right">{formatAmount(o.order_amount, o.currency)}</TableCell>
              <TableCell className="text-xs">{o.order_status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
