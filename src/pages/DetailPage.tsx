import { useState, useMemo, useCallback } from 'react'
import { useRiskStore } from '@/stores/riskStore'
import { useUiStore } from '@/stores/uiStore'
import { FilterBar } from '@/components/detail/FilterBar'
import { RiskOrderList } from '@/components/detail/RiskOrderList'
import { OrderDetailPanel } from '@/components/detail/OrderDetailPanel'
import type { RiskResult, ReviewStatus } from '@/types/risk'
import { Button } from '@/components/ui/button'
import { CheckCircle, Flag, XCircle } from 'lucide-react'

export default function DetailPage() {
  const { results, batchUpdateReviewStatus } = useRiskStore()
  const { detailFilters } = useUiStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const filteredResults = useMemo(() => {
    let filtered = results
    if (detailFilters.severity) filtered = filtered.filter(r => r.highest_severity === detailFilters.severity)
    if (detailFilters.ruleId) filtered = filtered.filter(r => r.flags.some(f => f.rule_id === detailFilters.ruleId))
    if (detailFilters.market) filtered = filtered.filter(r => r.order.market === detailFilters.market)
    if (detailFilters.side) filtered = filtered.filter(r => r.order.side === detailFilters.side)
    if (detailFilters.account) filtered = filtered.filter(r => r.order.account_id === detailFilters.account)
    if (detailFilters.symbol) filtered = filtered.filter(r => r.order.symbol === detailFilters.symbol)
    if (detailFilters.status) filtered = filtered.filter(r => r.order.order_status === detailFilters.status)
    if (detailFilters.search) {
      const q = detailFilters.search.toLowerCase()
      filtered = filtered.filter(r =>
        r.order.order_id.toLowerCase().includes(q) ||
        r.order.account_id.toLowerCase().includes(q) ||
        r.order.symbol.toLowerCase().includes(q) ||
        r.order.broker_id.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [results, detailFilters])

  const selectedResult = useMemo(
    () => filteredResults.find(r => r.order.order_id === selectedId) ?? null,
    [filteredResults, selectedId]
  )

  // Select first item if current selection is not in filtered results
  const effectiveSelected = selectedResult ?? (filteredResults.length > 0 ? filteredResults[0] : null)

  const handleBatchMark = useCallback((status: ReviewStatus) => {
    batchUpdateReviewStatus([...checkedIds], status)
    setCheckedIds(new Set())
  }, [batchUpdateReviewStatus, checkedIds])

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: filters + batch actions */}
      <div className="flex items-center gap-3 border-b px-4 py-2.5 min-h-[52px]">
        <FilterBar />
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {filteredResults.length} 条{filteredResults.length !== results.length && ` / ${results.length}`}
          </span>
        </div>
      </div>

      {/* Batch action bar */}
      {checkedIds.size > 0 && (
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-1.5">
          <span className="text-xs font-medium">已选 {checkedIds.size} 项</span>
          <div className="flex gap-1 ml-2">
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2" onClick={() => handleBatchMark('REVIEWED')}>
              <CheckCircle className="h-3 w-3" /> 已审阅
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2" onClick={() => handleBatchMark('FOLLOW_UP')}>
              <Flag className="h-3 w-3" /> 需跟进
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2" onClick={() => handleBatchMark('FALSE_POSITIVE')}>
              <XCircle className="h-3 w-3" /> 误报
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="h-6 text-xs px-2 ml-auto" onClick={() => setCheckedIds(new Set())}>
            取消
          </Button>
        </div>
      )}

      {/* Main content: list + detail split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: order list */}
        <div className="w-[420px] shrink-0 border-r flex flex-col overflow-hidden">
          <RiskOrderList
            results={filteredResults}
            selectedId={effectiveSelected?.order.order_id ?? null}
            checkedIds={checkedIds}
            onSelect={id => setSelectedId(id)}
            onToggleCheck={(id, checked) => {
              const next = new Set(checkedIds)
              if (checked) next.add(id)
              else next.delete(id)
              setCheckedIds(next)
            }}
          />
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 overflow-auto">
          {effectiveSelected ? (
            <OrderDetailPanel result={effectiveSelected} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {results.length === 0 ? '暂无风险订单' : '选择一条订单查看详情'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
