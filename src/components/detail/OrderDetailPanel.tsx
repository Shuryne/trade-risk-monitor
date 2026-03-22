import { memo, useMemo, useState } from 'react'
import type { RiskResult, RiskFlag, ReviewStatus } from '@/types/risk'
import type { Order } from '@/types/order'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { ReviewActions } from '@/components/detail/ReviewActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime, formatAmount, formatNumber, formatTime, sideColorClass } from '@/utils/formatters'
import { AlertTriangle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderDetailPanelProps {
  result: RiskResult | null;
  allOrders: Order[];
  riskResults: RiskResult[];
  note: string;
  onStatusChange: (orderId: string, status: ReviewStatus) => void;
  onNoteChange: (orderId: string, note: string) => void;
  onSelectOrder: (orderId: string) => void;
  summaryStats?: { total: number; high: number; medium: number; low: number };
}

// --- Zone 3 helpers ---

const RELATED_INITIAL_LIMIT = 10

function RelatedOrdersTable({
  orders,
  highlightId,
  onSelectOrder,
}: {
  orders: Order[]
  highlightId: string
  onSelectOrder: (orderId: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? orders : orders.slice(0, RELATED_INITIAL_LIMIT)
  const hasMore = orders.length > RELATED_INITIAL_LIMIT

  if (orders.length === 0) {
    return <p className="text-xs text-muted-foreground py-3 text-center">无关联交易</p>
  }

  return (
    <div className="space-y-1">
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
            {displayed.map(o => (
              <TableRow
                key={o.order_id}
                className={cn(
                  'text-xs cursor-pointer hover:bg-muted/50',
                  o.order_id === highlightId && 'bg-primary/5 font-medium',
                )}
                onClick={() => onSelectOrder(o.order_id)}
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
      {hasMore && (
        <button
          type="button"
          className="text-xs text-primary hover:underline px-1"
          onClick={() => setShowAll(prev => !prev)}
        >
          {showAll ? '收起' : `显示全部 ${orders.length} 条`}
        </button>
      )}
    </div>
  )
}

// --- Severity icon color ---

const severityIconColor: Record<string, string> = {
  HIGH: 'text-red-600',
  MEDIUM: 'text-orange-500',
  LOW: 'text-yellow-600',
}

// --- Zone 2: Single Rule Row ---

function RuleFlagRow({
  flag,
  onSelectOrder,
}: {
  flag: RiskFlag
  onSelectOrder: (orderId: string) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border px-3 py-2">
      <AlertTriangle className={cn('h-4 w-4 shrink-0 mt-0.5', severityIconColor[flag.severity] ?? 'text-muted-foreground')} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold">{flag.rule_id} {flag.rule_name}</p>
        <p className="text-xs text-muted-foreground break-words">{flag.description}</p>
        {flag.related_orders && flag.related_orders.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {flag.related_orders.map(relId => (
              <button
                key={relId}
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => onSelectOrder(relId)}
              >
                关联订单: {relId.slice(-10)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Component ---

export const OrderDetailPanel = memo(function OrderDetailPanel({
  result,
  allOrders,
  riskResults,
  note,
  onStatusChange,
  onNoteChange,
  onSelectOrder,
  summaryStats,
}: OrderDetailPanelProps) {

  // --- Empty State ---
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3">
        <ClipboardList className="h-12 w-12 opacity-30" />
        <p className="text-sm">选择左侧订单开始审查</p>
        {summaryStats && (
          <p className="text-xs">
            共 {summaryStats.total} 条风险订单 · {summaryStats.high} 高 · {summaryStats.medium} 中 · {summaryStats.low} 低
          </p>
        )}
        <p className="text-xs opacity-60">提示: 使用 ↑↓ 键导航, Enter 标记已审</p>
      </div>
    )
  }

  const o = result.order

  // --- Zone 2: collapsible rules ---
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const RULES_COLLAPSE_THRESHOLD = 3
  const visibleFlags = rulesExpanded ? result.flags : result.flags.slice(0, RULES_COLLAPSE_THRESHOLD)
  const hasHiddenRules = result.flags.length > RULES_COLLAPSE_THRESHOLD

  // --- Zone 3: related orders ---
  const { sameAccountOrders, sameSymbolOrders } = useMemo(() => {
    const acct: Order[] = []
    const sym: Order[] = []
    for (const ord of allOrders) {
      if (ord.order_id === o.order_id) continue
      if (ord.account_id === o.account_id) acct.push(ord)
      if (ord.symbol === o.symbol) sym.push(ord)
    }
    // Sort by time descending
    const timeDesc = (a: Order, b: Order) => b.order_time.localeCompare(a.order_time)
    acct.sort(timeDesc)
    sym.sort(timeDesc)
    return { sameAccountOrders: acct, sameSymbolOrders: sym }
  }, [allOrders, o.order_id, o.account_id, o.symbol])

  // Format the amount for display (compact)
  const displayAmount = (() => {
    const amt = o.order_amount
    if (amt >= 1_000_000) {
      return `${o.currency} ${(amt / 1_000_000).toFixed(2)}M`
    }
    if (amt >= 1_000) {
      return `${o.currency} ${(amt / 1_000).toFixed(1)}K`
    }
    return formatAmount(amt, o.currency)
  })()

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 pb-20">
        {/* Zone 1: Order Summary */}
        <Card size="sm">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{o.symbol}</h2>
              <RiskBadge severity={result.highest_severity} />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className={cn('font-medium', sideColorClass(o.side), 'px-1 py-0.5 rounded')}>
                {o.side}
              </span>
              {' · '}{o.open_close}{' · '}{o.market === 'HK' ? '港股' : '美股'}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">金额</p>
                <p className="text-sm font-mono tabular-nums font-bold mt-0.5">{displayAmount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">数量</p>
                <p className="text-sm font-mono tabular-nums mt-0.5">{formatNumber(o.order_quantity)}股</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">价格</p>
                <p className="text-sm font-mono tabular-nums mt-0.5">{o.order_price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">时间</p>
                <p className="text-sm font-mono tabular-nums mt-0.5">{formatTime(o.order_time)}</p>
              </div>
            </div>

            {/* Secondary info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>账户 <span className="font-mono text-foreground">{o.account_id}</span></span>
              <span>经纪人 <span className="font-mono text-foreground">{o.broker_id}</span></span>
              <span>订单号 <span className="font-mono text-foreground">{o.order_id.slice(-10)}</span></span>
            </div>

            {/* Message if present */}
            {o.message && (
              <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs">{o.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zone 2: Triggered Rules */}
        <Card size="sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">触发规则 ({result.flags.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleFlags.map((flag, i) => (
              <RuleFlagRow key={i} flag={flag} onSelectOrder={onSelectOrder} />
            ))}
            {hasHiddenRules && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => setRulesExpanded(prev => !prev)}
              >
                {rulesExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    显示更多 {result.flags.length - RULES_COLLAPSE_THRESHOLD} 条
                  </>
                )}
              </button>
            )}
          </CardContent>
        </Card>

        {/* Zone 3: Related Trades */}
        <Card size="sm">
          <CardContent className="pt-1">
            <Tabs defaultValue="account">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">关联交易</h3>
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
                <RelatedOrdersTable
                  orders={sameAccountOrders}
                  highlightId={o.order_id}
                  onSelectOrder={onSelectOrder}
                />
              </TabsContent>
              <TabsContent value="symbol" className="mt-0">
                <RelatedOrdersTable
                  orders={sameSymbolOrders}
                  highlightId={o.order_id}
                  onSelectOrder={onSelectOrder}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Zone 4: Review Actions - sticky at bottom */}
      <ReviewActions
        result={result}
        note={note}
        onStatusChange={onStatusChange}
        onNoteChange={onNoteChange}
      />
    </ScrollArea>
  )
})
