import { memo, useMemo } from 'react'
import type { RiskResult, ReviewStatus } from '@/types/risk'
import type { Order } from '@/types/order'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime, formatAmount, formatNumber, sideColorClass } from '@/utils/formatters'
import { useOrderStore } from '@/stores/orderStore'
import { useRiskStore } from '@/stores/riskStore'
import { CheckCircle, Flag, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusConfig: Record<ReviewStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  PENDING: { label: '待审阅', icon: Clock, className: 'text-muted-foreground' },
  REVIEWED: { label: '已审阅', icon: CheckCircle, className: 'text-green-600' },
  FOLLOW_UP: { label: '需跟进', icon: Flag, className: 'text-orange-600' },
  FALSE_POSITIVE: { label: '误报', icon: XCircle, className: 'text-muted-foreground' },
}

interface OrderDetailPanelProps {
  result: RiskResult;
}

export const OrderDetailPanel = memo(function OrderDetailPanel({ result }: OrderDetailPanelProps) {
  const allOrders = useOrderStore(s => s.orders)
  const updateReviewStatus = useRiskStore(s => s.updateReviewStatus)

  const { sameAccountOrders, sameSymbolOrders } = useMemo(() => {
    const acct: Order[] = []
    const sym: Order[] = []
    for (const o of allOrders) {
      if (o.account_id === result.order.account_id) acct.push(o)
      if (o.symbol === result.order.symbol) sym.push(o)
    }
    return { sameAccountOrders: acct, sameSymbolOrders: sym }
  }, [allOrders, result.order.account_id, result.order.symbol])

  const o = result.order
  const currentStatus = statusConfig[result.review_status]
  const CurrentStatusIcon = currentStatus.icon

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{o.symbol}</h2>
              <RiskBadge severity={result.highest_severity} />
              <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', sideColorClass(o.side))}>
                {o.side} · {o.open_close}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className={cn('flex items-center gap-1 text-xs mr-2', currentStatus.className)}>
                <CurrentStatusIcon className="h-3.5 w-3.5" />
                {currentStatus.label}
              </span>
              {result.review_status !== 'REVIEWED' && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateReviewStatus(o.order_id, 'REVIEWED')}>
                  已审阅
                </Button>
              )}
              {result.review_status !== 'FOLLOW_UP' && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateReviewStatus(o.order_id, 'FOLLOW_UP')}>
                  需跟进
                </Button>
              )}
              {result.review_status !== 'FALSE_POSITIVE' && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateReviewStatus(o.order_id, 'FALSE_POSITIVE')}>
                  误报
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <Field label="订单编号" value={o.order_id.slice(-10)} mono />
            <Field label="下单时间" value={formatDateTime(o.order_time)} />
            <Field label="账户" value={o.account_id} mono />
            <Field label="经纪人号" value={o.broker_id} mono />
            <Field label="委托价格" value={o.order_price.toFixed(4)} />
            <Field label="委托数量" value={formatNumber(o.order_quantity)} />
            <Field label="委托金额" value={formatAmount(o.order_amount, o.currency)} bold />
            <Field label="市场" value={`${o.market} · ${o.order_type}`} />
            <Field label="订单状态" value={o.order_status} />
            <Field label="已成交数量" value={formatNumber(o.filled_quantity)} />
            <Field label="已成交金额" value={formatAmount(o.filled_amount, o.currency)} />
            <Field label="成交均价" value={o.filled_avg_price > 0 ? o.filled_avg_price.toFixed(4) : '-'} />
          </div>

          {o.message && (
            <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs">{o.message}</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            触发规则 ({result.flags.length})
          </h3>
          <div className="space-y-1.5">
            {result.flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border px-3 py-2 hover:border-primary/20 transition-colors">
                <div className="shrink-0 pt-0.5">
                  <RiskBadge severity={flag.severity} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{flag.rule_id} {flag.rule_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 break-words">{flag.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="account" className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">关联交易</h3>
            <TabsList className="h-7">
              <TabsTrigger value="account" className="text-xs px-2.5 h-6">
                同账户 ({sameAccountOrders.length})
              </TabsTrigger>
              <TabsTrigger value="symbol" className="text-xs px-2.5 h-6">
                同标的 ({sameSymbolOrders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="account" className="mt-0">
            <RelatedOrdersTable orders={sameAccountOrders} highlightId={o.order_id} />
          </TabsContent>
          <TabsContent value="symbol" className="mt-0">
            <RelatedOrdersTable orders={sameSymbolOrders} highlightId={o.order_id} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
})

const Field = memo(function Field({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('text-sm mt-0.5', mono && 'font-mono', bold && 'font-semibold')}>{value}</p>
    </div>
  )
})

const RelatedOrdersTable = memo(function RelatedOrdersTable({ orders, highlightId }: { orders: Order[]; highlightId: string }) {
  return (
    <div className="rounded-md border max-h-80 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs h-8">时间</TableHead>
            <TableHead className="text-xs h-8">方向</TableHead>
            <TableHead className="text-xs h-8">标的</TableHead>
            <TableHead className="text-xs h-8 text-right">数量</TableHead>
            <TableHead className="text-xs h-8 text-right">金额</TableHead>
            <TableHead className="text-xs h-8">状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(o => (
            <TableRow
              key={o.order_id}
              className={cn('text-xs', o.order_id === highlightId && 'bg-primary/5 font-medium')}
            >
              <TableCell className="py-2 text-xs">{formatDateTime(o.order_time)}</TableCell>
              <TableCell className={cn('py-2 text-xs', o.side === '買入' ? 'text-red-600' : 'text-green-600')}>
                {o.side}
              </TableCell>
              <TableCell className="py-2 text-xs font-medium">{o.symbol}</TableCell>
              <TableCell className="py-2 text-xs text-right tabular-nums">{formatNumber(o.order_quantity)}</TableCell>
              <TableCell className="py-2 text-xs text-right tabular-nums">{formatAmount(o.order_amount, o.currency)}</TableCell>
              <TableCell className="py-2 text-xs">{o.order_status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
})
