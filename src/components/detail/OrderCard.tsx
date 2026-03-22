import { memo } from 'react';
import type { RiskResult, ReviewStatus } from '@/types/risk';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { formatAmount, formatTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  result: RiskResult;
  isActive: boolean;
  isFocused: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
  onClick: (e: React.MouseEvent, id: string) => void;
}

const severityBorderColor: Record<string, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-orange-400',
  LOW: 'border-l-yellow-400',
};

const reviewStatusDot: Record<ReviewStatus, { bg: string; icon?: boolean }> = {
  PENDING: { bg: 'bg-gray-400' },
  REVIEWED: { bg: 'bg-green-500' },
  FOLLOW_UP: { bg: 'bg-orange-500' },
  FALSE_POSITIVE: { bg: 'bg-gray-300', icon: true },
};

export const OrderCard = memo(function OrderCard({
  result, isActive, isFocused, isChecked, onSelect, onToggleCheck, onClick,
}: OrderCardProps) {
  const { order, flags, highest_severity, review_status } = result;
  const isProcessed = review_status !== 'PENDING';
  const isFalsePositive = review_status === 'FALSE_POSITIVE';
  const isFollowUp = review_status === 'FOLLOW_UP';

  return (
    <div
      className={cn(
        'relative flex items-start gap-2 px-3 py-2.5 border-l-4 cursor-pointer transition-colors',
        severityBorderColor[highest_severity],
        isActive && 'bg-primary/5 border-l-primary',
        isFocused && 'ring-2 ring-primary ring-inset',
        isProcessed && 'opacity-60',
        !isActive && !isFocused && 'hover:bg-muted/50',
        isFollowUp && 'border-r-2 border-r-orange-500',
      )}
      onClick={(e) => {
        if (e.shiftKey) {
          onClick(e, order.order_id);
        } else {
          onSelect(order.order_id);
        }
      }}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={(checked) => onToggleCheck(order.order_id, !!checked)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium truncate">{order.symbol}</span>
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className={order.side === '買入' ? 'text-red-600' : 'text-green-600'}>
              {order.side}
            </span>
            <span className="text-muted-foreground">
              {formatTime(order.order_time)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{order.account_id} · {order.broker_id}</span>
          <span className="font-mono tabular-nums font-medium text-foreground shrink-0">
            {formatAmount(order.order_amount, order.currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {flags.slice(0, 3).map((f) => (
              <span
                key={f.rule_id}
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground',
                  isFalsePositive && 'line-through',
                )}
              >
                {f.rule_id}
              </span>
            ))}
            {flags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{flags.length - 3}</span>
            )}
          </div>
          <span className="relative shrink-0">
            <span className={cn('block w-2 h-2 rounded-full', reviewStatusDot[review_status].bg)} />
            {reviewStatusDot[review_status].icon && (
              <X className="absolute -top-0.5 -left-0.5 w-3 h-3 text-gray-500" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
});
