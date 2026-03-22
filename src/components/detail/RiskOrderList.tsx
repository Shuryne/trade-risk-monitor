import { useRef, useState, useEffect, useMemo, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RiskResult, ReviewStatus } from '@/types/risk'
import type { RuleSeverity } from '@/types/rule'
import { useUiStore } from '@/stores/uiStore'
import { GroupHeader } from './GroupHeader'
import { OrderCard } from './OrderCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListRow =
  | { type: 'header'; severity: RuleSeverity; results: RiskResult[] }
  | { type: 'item'; result: RiskResult }

interface RiskOrderListProps {
  results: RiskResult[]
  selectedId: string | null
  focusedIndex: number
  checkedIds: Set<string>
  onSelect: (id: string) => void
  onToggleCheck: (id: string, checked: boolean) => void
  onShiftClick: (e: React.MouseEvent, id: string) => void
  onBatchMark: (ids: string[], status: ReviewStatus) => void
}

// ---------------------------------------------------------------------------
// Severity order
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: RuleSeverity[] = ['HIGH', 'MEDIUM', 'LOW']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sortResults(
  results: RiskResult[],
  sortBy: 'amount' | 'time' | 'ruleCount',
): RiskResult[] {
  const sorted = [...results]
  switch (sortBy) {
    case 'amount':
      sorted.sort((a, b) => b.order.order_amount - a.order.order_amount)
      break
    case 'time':
      sorted.sort(
        (a, b) =>
          new Date(b.order.order_time).getTime() -
          new Date(a.order.order_time).getTime(),
      )
      break
    case 'ruleCount':
      sorted.sort((a, b) => b.flags.length - a.flags.length)
      break
  }
  return sorted
}

function isGroupComplete(results: RiskResult[]): boolean {
  return results.length > 0 && results.every((r) => r.review_status !== 'PENDING')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RiskOrderList = memo(function RiskOrderList({
  results,
  selectedId,
  focusedIndex,
  checkedIds,
  onSelect,
  onToggleCheck,
  onShiftClick,
  onBatchMark,
}: RiskOrderListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sortBy = useUiStore((s) => s.sortBy)

  // ---- Collapse state ----
  const [collapsed, setCollapsed] = useState<Record<RuleSeverity, boolean>>({
    HIGH: false,
    MEDIUM: false,
    LOW: true,
  })

  const toggleCollapse = (severity: RuleSeverity) => {
    setCollapsed((prev) => ({ ...prev, [severity]: !prev[severity] }))
  }

  // ---- Group results by severity and sort within groups ----
  const groupedResults = useMemo(() => {
    const groups: Record<RuleSeverity, RiskResult[]> = {
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    }
    for (const r of results) {
      groups[r.highest_severity].push(r)
    }
    return {
      HIGH: sortResults(groups.HIGH, sortBy),
      MEDIUM: sortResults(groups.MEDIUM, sortBy),
      LOW: sortResults(groups.LOW, sortBy),
    }
  }, [results, sortBy])

  // ---- Auto-collapse on group completion ----
  // Track previous completion state to only trigger when a group *becomes* complete
  const prevCompleteRef = useRef<Record<RuleSeverity, boolean>>({
    HIGH: false,
    MEDIUM: false,
    LOW: false,
  })

  useEffect(() => {
    const newCollapsed = { ...collapsed }
    let changed = false

    for (const sev of SEVERITY_ORDER) {
      const groupResults = groupedResults[sev]
      const wasComplete = prevCompleteRef.current[sev]
      const nowComplete = isGroupComplete(groupResults)

      // Only auto-collapse when the group transitions to complete (not on mount)
      if (nowComplete && !wasComplete && groupResults.length > 0) {
        newCollapsed[sev] = true
        changed = true
      }

      prevCompleteRef.current[sev] = nowComplete
    }

    if (changed) {
      setCollapsed(newCollapsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedResults])

  // ---- Build flat rows for virtualizer ----
  // Also build a mapping from order-index to flatRow-index so we can
  // translate focusedIndex (order-space) to flatRow-space for scrolling,
  // and track each item row's order-index for the isFocused comparison.
  const { flatRows, orderIndexToFlatRow, flatRowToOrderIndex } = useMemo(() => {
    const rows: ListRow[] = []
    const oToF: Map<number, number> = new Map()
    const fToO: Map<number, number> = new Map()
    let orderIdx = 0

    for (const sev of SEVERITY_ORDER) {
      const groupResults = groupedResults[sev]
      if (groupResults.length === 0) continue

      rows.push({ type: 'header', severity: sev, results: groupResults })

      if (!collapsed[sev]) {
        for (const result of groupResults) {
          const flatIdx = rows.length
          oToF.set(orderIdx, flatIdx)
          fToO.set(flatIdx, orderIdx)
          rows.push({ type: 'item', result })
          orderIdx++
        }
      } else {
        // Even when collapsed, advance order index so the mapping stays consistent
        orderIdx += groupResults.length
      }
    }
    return { flatRows: rows, orderIndexToFlatRow: oToF, flatRowToOrderIndex: fToO }
  }, [groupedResults, collapsed])

  // ---- Virtualizer ----
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (flatRows[index].type === 'header' ? 48 : 96),
    overscan: 5,
  })

  // ---- Scroll to focused index ----
  useEffect(() => {
    const flatIdx = orderIndexToFlatRow.get(focusedIndex)
    if (flatIdx !== undefined) {
      virtualizer.scrollToIndex(flatIdx, { align: 'center' })
    }
  }, [focusedIndex, orderIndexToFlatRow, virtualizer])

  // ---- Empty state ----
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
        className="relative w-full transition-[height] duration-150"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const row = flatRows[virtualItem.index]

          return (
            <div
              key={virtualItem.key}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {row.type === 'header' ? (
                <GroupHeaderRow
                  row={row}
                  collapsed={collapsed}
                  checkedIds={checkedIds}
                  onToggleCollapse={toggleCollapse}
                  onToggleCheck={onToggleCheck}
                  onBatchMark={onBatchMark}
                />
              ) : (
                <OrderCard
                  result={row.result}
                  isActive={row.result.order.order_id === selectedId}
                  isFocused={flatRowToOrderIndex.get(virtualItem.index) === focusedIndex}
                  isChecked={checkedIds.has(row.result.order.order_id)}
                  onSelect={onSelect}
                  onToggleCheck={onToggleCheck}
                  onClick={onShiftClick}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// GroupHeader row wrapper — extracts stats and wires props
// ---------------------------------------------------------------------------

interface GroupHeaderRowProps {
  row: Extract<ListRow, { type: 'header' }>
  collapsed: Record<RuleSeverity, boolean>
  checkedIds: Set<string>
  onToggleCollapse: (severity: RuleSeverity) => void
  onToggleCheck: (id: string, checked: boolean) => void
  onBatchMark: (ids: string[], status: ReviewStatus) => void
}

const GroupHeaderRow = memo(function GroupHeaderRow({
  row,
  collapsed,
  checkedIds,
  onToggleCollapse,
  onToggleCheck,
  onBatchMark,
}: GroupHeaderRowProps) {
  const { severity, results: groupResults } = row

  const pendingCount = groupResults.filter((r) => r.review_status === 'PENDING').length
  const reviewedCount = groupResults.filter((r) => r.review_status === 'REVIEWED').length
  const followUpCount = groupResults.filter((r) => r.review_status === 'FOLLOW_UP').length

  const groupIds = groupResults.map((r) => r.order.order_id)
  const checkedInGroup = groupIds.filter((id) => checkedIds.has(id))
  const isAllSelected = checkedInGroup.length === groupIds.length
  const isSomeSelected = checkedInGroup.length > 0 && !isAllSelected

  return (
    <GroupHeader
      severity={severity}
      total={groupResults.length}
      pendingCount={pendingCount}
      reviewedCount={reviewedCount}
      followUpCount={followUpCount}
      isExpanded={!collapsed[severity]}
      isAllSelected={isAllSelected}
      isSomeSelected={isSomeSelected}
      onToggleExpand={() => onToggleCollapse(severity)}
      onSelectAll={() => {
        // Toggle: if all are selected, deselect all; otherwise select all
        const shouldSelect = !isAllSelected
        for (const id of groupIds) {
          onToggleCheck(id, shouldSelect)
        }
      }}
      onMarkAllReviewed={() => {
        onBatchMark(groupIds, 'REVIEWED')
      }}
    />
  )
})
