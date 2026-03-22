import type { RiskResult } from '@/types/risk'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDateTime, formatAmount } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RiskOrderListProps {
  results: RiskResult[];
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
}

export function RiskOrderList({ results, selectedId, checkedIds, onSelect, onToggleCheck }: RiskOrderListProps) {
  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-xs text-muted-foreground">没有匹配的风险订单</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {results.map(r => {
          const isSelected = r.order.order_id === selectedId
          const isChecked = checkedIds.has(r.order.order_id)

          return (
            <div
              key={r.order.order_id}
              className={cn(
                'group flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors',
                isSelected
                  ? 'bg-accent'
                  : 'hover:bg-muted/50',
              )}
              onClick={() => onSelect(r.order.order_id)}
            >
              {/* Checkbox */}
              <div className="pt-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={checked => onToggleCheck(r.order.order_id, !!checked)}
                  className="h-3.5 w-3.5"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Row 1: severity + symbol + side + account */}
                <div className="flex items-center gap-2">
                  <RiskBadge severity={r.highest_severity} />
                  <span className="text-xs font-semibold truncate">{r.order.symbol}</span>
                  <span className={cn(
                    'text-[10px] font-medium px-1 py-0.5 rounded',
                    r.order.side === '買入'
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      : 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                  )}>
                    {r.order.side}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{r.order.market}</span>
                </div>

                {/* Row 2: account + amount */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono text-muted-foreground truncate">{r.order.account_id}</span>
                  <span className="ml-auto tabular-nums font-medium shrink-0">
                    {formatAmount(r.order.order_amount, r.order.currency)}
                  </span>
                </div>

                {/* Row 3: time + rule count + status */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{formatDateTime(r.order.order_time)}</span>
                  <span className="ml-auto shrink-0">{r.flags.length} 条规则</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
