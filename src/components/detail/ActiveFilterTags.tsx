import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { DEFAULT_RULE_CONFIGS } from '@/utils/constants'
import type { ReviewStatus } from '@/types/risk'

const REVIEW_STATUS_LABELS: Record<'ALL' | ReviewStatus, string> = {
  ALL: '全部',
  PENDING: '待审查',
  REVIEWED: '已审查',
  FOLLOW_UP: '需跟进',
  FALSE_POSITIVE: '误报',
}

const MARKET_LABELS: Record<string, string> = {
  HK: '港股',
  US: '美股',
}

export const ActiveFilterTags = memo(function ActiveFilterTags() {
  const {
    detailFilters,
    setDetailFilter,
    resetDetailFilters,
    reviewStatusFilter,
    setReviewStatusFilter,
  } = useUiStore()

  // Build the list of active filter chips
  type Chip = { key: string; label: string; onRemove: () => void }
  const chips: Chip[] = []

  if (detailFilters.search) {
    chips.push({
      key: 'search',
      label: `搜索: ${detailFilters.search}`,
      onRemove: () => setDetailFilter('search', ''),
    })
  }

  if (detailFilters.market) {
    chips.push({
      key: 'market',
      label: `市场: ${MARKET_LABELS[detailFilters.market] ?? detailFilters.market}`,
      onRemove: () => setDetailFilter('market', null),
    })
  }

  if (detailFilters.side) {
    chips.push({
      key: 'side',
      label: `方向: ${detailFilters.side}`,
      onRemove: () => setDetailFilter('side', null),
    })
  }

  if (detailFilters.ruleId) {
    const rule = DEFAULT_RULE_CONFIGS.find(r => r.rule_id === detailFilters.ruleId)
    const ruleLabel = rule ? `${rule.rule_id} ${rule.name}` : detailFilters.ruleId
    chips.push({
      key: 'ruleId',
      label: `规则: ${ruleLabel}`,
      onRemove: () => setDetailFilter('ruleId', null),
    })
  }

  if (detailFilters.account) {
    chips.push({
      key: 'account',
      label: `账户: ${detailFilters.account}`,
      onRemove: () => setDetailFilter('account', null),
    })
  }

  if (detailFilters.broker) {
    chips.push({
      key: 'broker',
      label: `经纪人: ${detailFilters.broker}`,
      onRemove: () => setDetailFilter('broker', null),
    })
  }

  if (detailFilters.status) {
    chips.push({
      key: 'status',
      label: `状态: ${detailFilters.status}`,
      onRemove: () => setDetailFilter('status', null),
    })
  }

  if (reviewStatusFilter !== 'ALL') {
    chips.push({
      key: 'reviewStatus',
      label: `审查: ${REVIEW_STATUS_LABELS[reviewStatusFilter]}`,
      onRemove: () => setReviewStatusFilter('ALL'),
    })
  }

  if (chips.length === 0) return null

  function handleClearAll() {
    resetDetailFilters()
    setReviewStatusFilter('ALL')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-b">
      {chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs text-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="ml-0.5 rounded-sm opacity-60 hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`清除 ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <Button
        variant="ghost"
        size="xs"
        onClick={handleClearAll}
        className="h-6 text-xs px-1.5 text-muted-foreground hover:text-foreground"
      >
        清除全部
      </Button>
    </div>
  )
})
