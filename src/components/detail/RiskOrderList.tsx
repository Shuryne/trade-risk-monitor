import type { RiskResult } from '@/types/risk'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDateTime, formatAmount, sideColorClass } from '@/utils/formatters'
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
                isSelected ? 'bg-accent' : 'hover:bg-muted/50',
              )}
              onClick={() => onSelect(r.order.order_id)}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={checked => onToggleCheck(r.order.order_id, !!checked)}
                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                onClick={e => e.stopPropagation()}
              />

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <RiskBadge severity={r.highest_severity} />
                  <span className="text-xs font-semibold truncate">{r.order.symbol}</span>
                  <span className={cn('text-[10px] font-medium px-1 py-0.5 rounded', sideColorClass(r.order.side))}>
                    {r.order.side}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{r.order.market}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono text-muted-foreground truncate">{r.order.account_id}</span>
                  <span className="ml-auto tabular-nums font-medium shrink-0">
                    {formatAmount(r.order.order_amount, r.order.currency)}
                  </span>
                </div>

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
