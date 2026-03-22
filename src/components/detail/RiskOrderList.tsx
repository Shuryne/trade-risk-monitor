import { useRef, memo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RiskResult } from '@/types/risk'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDateTime, formatAmount, sideColorClass } from '@/utils/formatters'
import { cn } from '@/lib/utils'

interface RiskOrderListProps {
  results: RiskResult[];
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
}

const severityBorderColor: Record<string, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-orange-400',
  LOW: 'border-l-yellow-400',
}

export const RiskOrderList = memo(function RiskOrderList({
  results,
  selectedId,
  checkedIds,
  onSelect,
  onToggleCheck,
}: RiskOrderListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 82,
    overscan: 8,
  })

  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">没有匹配的风险订单</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            className="absolute left-0 top-0 w-full"
            style={{ height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}
          >
            <RiskOrderItem
              result={results[virtualItem.index]}
              isSelected={results[virtualItem.index].order.order_id === selectedId}
              isChecked={checkedIds.has(results[virtualItem.index].order.order_id)}
              onSelect={onSelect}
              onToggleCheck={onToggleCheck}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

interface RiskOrderItemProps {
  result: RiskResult;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
}

const RiskOrderItem = memo(function RiskOrderItem({
  result: r,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
}: RiskOrderItemProps) {
  const handleClick = useCallback(() => onSelect(r.order.order_id), [onSelect, r.order.order_id])
  const handleCheck = useCallback(
    (checked: boolean | 'indeterminate') => onToggleCheck(r.order.order_id, !!checked),
    [onToggleCheck, r.order.order_id],
  )

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-l-2',
        severityBorderColor[r.highest_severity] ?? 'border-l-transparent',
        isSelected ? 'bg-accent border-l-primary' : 'hover:bg-muted/50',
      )}
      onClick={handleClick}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleCheck}
        className="h-4 w-4 mt-0.5 shrink-0"
        onClick={e => e.stopPropagation()}
      />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <RiskBadge severity={r.highest_severity} />
          <span className="text-sm font-semibold truncate">{r.order.symbol}</span>
          <span className={cn('text-xs font-medium px-1 py-0.5 rounded', sideColorClass(r.order.side))}>
            {r.order.side}
          </span>
          <span className="text-xs text-muted-foreground ml-auto shrink-0">{r.order.market}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-muted-foreground truncate">{r.order.account_id}</span>
          <span className="ml-auto tabular-nums font-medium shrink-0">
            {formatAmount(r.order.order_amount, r.order.currency)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDateTime(r.order.order_time)}</span>
          <span className="ml-auto shrink-0">{r.flags.length} 条规则</span>
        </div>
      </div>
    </div>
  )
})
