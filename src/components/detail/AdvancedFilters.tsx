import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { useUiStore } from '@/stores/uiStore'
import { DEFAULT_RULE_CONFIGS, VALID_ORDER_STATUSES } from '@/utils/constants'
import type { ReviewStatus } from '@/types/risk'

const ALL_VALUE = '__all__'

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

const REVIEW_STATUS_OPTIONS: { value: 'ALL' | ReviewStatus; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待审查' },
  { value: 'REVIEWED', label: '已审查' },
  { value: 'FOLLOW_UP', label: '需跟进' },
  { value: 'FALSE_POSITIVE', label: '误报' },
]

export const AdvancedFilters = memo(function AdvancedFilters({
  isOpen,
  onClose,
}: AdvancedFiltersProps) {
  const {
    detailFilters,
    setDetailFilter,
    resetDetailFilters,
    reviewStatusFilter,
    setReviewStatusFilter,
  } = useUiStore()

  function handleReset() {
    resetDetailFilters()
    setReviewStatusFilter('ALL')
  }

  return (
    <Collapsible open={isOpen}>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-3 p-3 border-b bg-muted/30">
          {/* 规则类型 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">规则类型</label>
            <Select
              value={detailFilters.ruleId ?? ''}
              onValueChange={v => setDetailFilter('ruleId', v === ALL_VALUE ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="全部规则" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE} className="text-xs">全部规则</SelectItem>
                {DEFAULT_RULE_CONFIGS.map(r => (
                  <SelectItem key={r.rule_id} value={r.rule_id} className="text-xs">
                    {r.rule_id} {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 账户 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">账户</label>
            <Input
              placeholder="输入账户号..."
              value={detailFilters.account ?? ''}
              onChange={e => setDetailFilter('account', e.target.value || null)}
              className="h-8 text-xs"
            />
          </div>

          {/* 经纪人 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">经纪人</label>
            <Input
              placeholder="输入经纪人号..."
              value={detailFilters.broker ?? ''}
              onChange={e => setDetailFilter('broker', e.target.value || null)}
              className="h-8 text-xs"
            />
          </div>

          {/* 订单状态 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">订单状态</label>
            <Select
              value={detailFilters.status ?? ''}
              onValueChange={v => setDetailFilter('status', v === ALL_VALUE ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE} className="text-xs">全部状态</SelectItem>
                {VALID_ORDER_STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 审查状态 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">审查状态</label>
            <Select
              value={reviewStatusFilter}
              onValueChange={v => setReviewStatusFilter(v as 'ALL' | ReviewStatus)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                {REVIEW_STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bottom row: reset + collapse — spans both columns */}
          <div className="col-span-2 flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs px-2"
            >
              重置全部
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 text-xs px-2"
            >
              收起
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})
