import { memo } from 'react';
import type { RuleSeverity } from '@/types/rule';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupHeaderProps {
  severity: RuleSeverity;
  total: number;
  pendingCount: number;
  reviewedCount: number;
  followUpCount: number;
  isExpanded: boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onToggleExpand: () => void;
  onSelectAll: () => void;
  onMarkAllReviewed: () => void;
}

const severityConfig: Record<RuleSeverity, { label: string; color: string; bg: string }> = {
  HIGH: { label: '严重', color: 'text-red-600', bg: 'bg-red-50' },
  MEDIUM: { label: '中等', color: 'text-orange-600', bg: 'bg-orange-50' },
  LOW: { label: '低风险', color: 'text-yellow-600', bg: 'bg-yellow-50' },
};

export const GroupHeader = memo(function GroupHeader({
  severity, total, pendingCount, reviewedCount, followUpCount,
  isExpanded, isAllSelected, isSomeSelected,
  onToggleExpand, onSelectAll, onMarkAllReviewed,
}: GroupHeaderProps) {
  const config = severityConfig[severity];
  const isComplete = pendingCount === 0;

  return (
    <div className={cn('sticky top-0 z-10 border-b', config.bg)}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            className="p-0.5 hover:bg-black/5 rounded"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {isComplete && <Check className="h-4 w-4 text-green-600" />}
          <span className={cn('text-sm font-semibold', isComplete ? 'text-green-600' : config.color)}>
            {severity} {config.label}
          </span>
          <span className="text-xs text-muted-foreground">({total})</span>
        </div>
        {isExpanded && !isComplete && (
          <div className="flex items-center gap-1">
            <Checkbox
              checked={isAllSelected}
              indeterminate={!isAllSelected && isSomeSelected}
              onCheckedChange={() => onSelectAll()}
              className="mr-1"
            />
            <Button variant="ghost" size="xs" onClick={onMarkAllReviewed}>
              全部标记已审
            </Button>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="flex gap-3 px-10 pb-1.5 text-[11px] text-muted-foreground">
          <span>{pendingCount} 待审</span>
          <span>·</span>
          <span>{reviewedCount} 已审</span>
          <span>·</span>
          <span>{followUpCount} 需跟进</span>
        </div>
      )}
    </div>
  );
});
