import { useState, useMemo, useCallback, useRef } from 'react'
import { useRiskStore } from '@/stores/riskStore'
import { useUiStore } from '@/stores/uiStore'
import { useOrderStore } from '@/stores/orderStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { ReviewProgressBar } from '@/components/detail/ReviewProgressBar'
import { QuickFilters } from '@/components/detail/QuickFilters'
import { AdvancedFilters } from '@/components/detail/AdvancedFilters'
import { ActiveFilterTags } from '@/components/detail/ActiveFilterTags'
import { RiskOrderList } from '@/components/detail/RiskOrderList'
import { OrderDetailPanel } from '@/components/detail/OrderDetailPanel'
import { BatchActionBar } from '@/components/detail/BatchActionBar'
import { ShortcutHintBar } from '@/components/detail/ShortcutHintBar'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import type { ReviewStatus } from '@/types/risk'

export default function DetailPage() {
  // ---------------------------------------------------------------------------
  // Store selectors
  // ---------------------------------------------------------------------------
  const riskResults = useRiskStore((s) => s.results)
  const notes = useRiskStore((s) => s.notes)
  const firstReviewAt = useRiskStore((s) => s.firstReviewAt)
  const lastReviewAt = useRiskStore((s) => s.lastReviewAt)
  const updateReviewStatus = useRiskStore((s) => s.updateReviewStatus)
  const batchUpdateReviewStatus = useRiskStore((s) => s.batchUpdateReviewStatus)
  const setNote = useRiskStore((s) => s.setNote)

  const detailFilters = useUiStore((s) => s.detailFilters)
  const reviewStatusFilter = useUiStore((s) => s.reviewStatusFilter)
  const advancedFiltersOpen = useUiStore((s) => s.advancedFiltersOpen)
  const setAdvancedFiltersOpen = useUiStore((s) => s.setAdvancedFiltersOpen)

  const allOrders = useOrderStore((s) => s.orders)

  const isMobile = useIsMobile()

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const searchRef = useRef<HTMLInputElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  // ---------------------------------------------------------------------------
  // Selection state
  // ---------------------------------------------------------------------------
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [lastCheckedId, setLastCheckedId] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredResults = useMemo(() => {
    let filtered = riskResults
    const { search, market, side, ruleId, account, broker, status } = detailFilters

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.order.symbol.toLowerCase().includes(q) ||
          r.order.account_id.toLowerCase().includes(q) ||
          r.order.broker_id.toLowerCase().includes(q),
      )
    }
    if (market) filtered = filtered.filter((r) => r.order.market === market)
    if (side) filtered = filtered.filter((r) => r.order.side === side)
    if (ruleId)
      filtered = filtered.filter((r) => r.flags.some((f) => f.rule_id === ruleId))
    if (account)
      filtered = filtered.filter((r) => r.order.account_id.includes(account))
    if (broker)
      filtered = filtered.filter((r) => r.order.broker_id.includes(broker))
    if (status)
      filtered = filtered.filter((r) => r.order.order_status === status)
    if (reviewStatusFilter !== 'ALL') {
      filtered = filtered.filter((r) => r.review_status === reviewStatusFilter)
    }

    return filtered
  }, [riskResults, detailFilters, reviewStatusFilter])

  // ---------------------------------------------------------------------------
  // Derived: auto-select first item if current selection is not visible
  // ---------------------------------------------------------------------------
  const selectedResult = useMemo(() => {
    return (
      filteredResults.find((r) => r.order.order_id === selectedId) ??
      filteredResults[0] ??
      null
    )
  }, [filteredResults, selectedId])

  const effectiveSelectedId = selectedResult?.order.order_id ?? null

  // ---------------------------------------------------------------------------
  // Summary stats (for empty-state panel)
  // ---------------------------------------------------------------------------
  const summaryStats = useMemo(
    () => ({
      total: riskResults.length,
      high: riskResults.filter((r) => r.highest_severity === 'HIGH').length,
      medium: riskResults.filter((r) => r.highest_severity === 'MEDIUM').length,
      low: riskResults.filter((r) => r.highest_severity === 'LOW').length,
    }),
    [riskResults],
  )

  // ---------------------------------------------------------------------------
  // Active advanced filter count (for QuickFilters badge)
  // ---------------------------------------------------------------------------
  const activeAdvancedCount = useMemo(() => {
    let count = 0
    if (detailFilters.ruleId) count++
    if (detailFilters.account) count++
    if (detailFilters.broker) count++
    if (detailFilters.status) count++
    if (reviewStatusFilter !== 'ALL') count++
    return count
  }, [detailFilters.ruleId, detailFilters.account, detailFilters.broker, detailFilters.status, reviewStatusFilter])

  // ---------------------------------------------------------------------------
  // Current note for selected order
  // ---------------------------------------------------------------------------
  const currentNote = useMemo(() => {
    if (!effectiveSelectedId) return ''
    return notes[effectiveSelectedId] ?? ''
  }, [notes, effectiveSelectedId])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id)
      setLastCheckedId(id)
    },
    [],
  )

  const handleToggleCheck = useCallback((id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
    setLastCheckedId(id)
  }, [])

  const handleShiftClick = useCallback(
    (_e: React.MouseEvent, id: string) => {
      if (!lastCheckedId) return
      const ids = filteredResults.map((r) => r.order.order_id)
      const start = ids.indexOf(lastCheckedId)
      const end = ids.indexOf(id)
      if (start === -1 || end === -1) return
      const range = ids.slice(Math.min(start, end), Math.max(start, end) + 1)
      setCheckedIds((prev) => new Set([...prev, ...range]))
    },
    [lastCheckedId, filteredResults],
  )

  const handleStatusChange = useCallback(
    (orderId: string, status: ReviewStatus) => {
      updateReviewStatus(orderId, status)
    },
    [updateReviewStatus],
  )

  const handleNoteChange = useCallback(
    (orderId: string, note: string) => {
      setNote(orderId, note)
    },
    [setNote],
  )

  const handleBatchMark = useCallback(
    (ids: string[], status: ReviewStatus) => {
      batchUpdateReviewStatus(ids, status)
    },
    [batchUpdateReviewStatus],
  )

  const handleBatchMarkFromBar = useCallback(
    (status: ReviewStatus) => {
      batchUpdateReviewStatus(Array.from(checkedIds), status)
      setCheckedIds(new Set())
    },
    [batchUpdateReviewStatus, checkedIds],
  )

  const handleClearSelection = useCallback(() => {
    setCheckedIds(new Set())
  }, [])

  const handleFilterFollowUp = useCallback(() => {
    const current = useUiStore.getState().reviewStatusFilter
    useUiStore
      .getState()
      .setReviewStatusFilter(current === 'FOLLOW_UP' ? 'ALL' : 'FOLLOW_UP')
  }, [])

  const handleToggleAdvanced = useCallback(() => {
    setAdvancedFiltersOpen(!advancedFiltersOpen)
  }, [setAdvancedFiltersOpen, advancedFiltersOpen])

  const handleCloseAdvanced = useCallback(() => {
    setAdvancedFiltersOpen(false)
  }, [setAdvancedFiltersOpen])

  const handleEscape = useCallback(() => {
    const store = useUiStore.getState()
    if (store.advancedFiltersOpen) {
      store.setAdvancedFiltersOpen(false)
    } else if (store.detailFilters.search) {
      store.setDetailFilter('search', '')
    } else {
      setCheckedIds(new Set())
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------------
  const filteredOrderIds = useMemo(
    () => filteredResults.map((r) => r.order.order_id),
    [filteredResults],
  )

  const getNextPendingId = useCallback(
    (currentId: string) => {
      const currentIdx = filteredOrderIds.indexOf(currentId)
      for (let i = currentIdx + 1; i < filteredResults.length; i++) {
        if (filteredResults[i].review_status === 'PENDING') {
          return filteredResults[i].order.order_id
        }
      }
      return null
    },
    [filteredResults, filteredOrderIds],
  )

  const { focusedIndex } = useKeyboardNavigation({
    orderIds: filteredOrderIds,
    selectedId: effectiveSelectedId,
    onSelect: handleSelect,
    onMarkReviewed: (id) => handleStatusChange(id, 'REVIEWED'),
    onMarkFollowUp: (id) => handleStatusChange(id, 'FOLLOW_UP'),
    onToggleCheck: (id) => handleToggleCheck(id, !checkedIds.has(id)),
    onToggleGroup: () => {
      // No-op for now — would need a ref to RiskOrderList's internal collapse state
    },
    onFocusSearch: () => searchRef.current?.focus(),
    onEscape: handleEscape,
    getNextPendingId,
    listRef: listContainerRef,
    enabled: true,
  })

  // ---------------------------------------------------------------------------
  // Shared panel content (used in both mobile and desktop layouts)
  // ---------------------------------------------------------------------------
  const leftPanel = (
    <div className="flex flex-col h-full">
      <QuickFilters
        searchRef={searchRef}
        onToggleAdvanced={handleToggleAdvanced}
        advancedOpen={advancedFiltersOpen}
        activeAdvancedCount={activeAdvancedCount}
      />
      <AdvancedFilters isOpen={advancedFiltersOpen} onClose={handleCloseAdvanced} />
      <ActiveFilterTags />
      <div className="flex-1 overflow-hidden" ref={listContainerRef}>
        <RiskOrderList
          results={filteredResults}
          selectedId={effectiveSelectedId}
          focusedIndex={focusedIndex}
          checkedIds={checkedIds}
          onSelect={handleSelect}
          onToggleCheck={handleToggleCheck}
          onShiftClick={handleShiftClick}
          onBatchMark={handleBatchMark}
        />
      </div>
      <BatchActionBar
        checkedCount={checkedIds.size}
        onBatchMark={handleBatchMarkFromBar}
        onClearSelection={handleClearSelection}
      />
    </div>
  )

  const rightPanel = (
    <OrderDetailPanel
      result={selectedResult}
      allOrders={allOrders}
      note={currentNote}
      onStatusChange={handleStatusChange}
      onNoteChange={handleNoteChange}
      onSelectOrder={handleSelect}
      summaryStats={summaryStats}
    />
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      {/* Review Progress Bar — full width */}
      <ReviewProgressBar
        results={riskResults}
        firstReviewAt={firstReviewAt}
        lastReviewAt={lastReviewAt}
        onFilterFollowUp={handleFilterFollowUp}
      />

      {/* Resizable two-panel layout */}
      {isMobile ? (
        /* Stacked layout for mobile */
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="h-1/2 flex flex-col border-b">{leftPanel}</div>
          <div className="flex-1 overflow-hidden">{rightPanel}</div>
        </div>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1"
          id="detail-panel"
        >
          <ResizablePanel defaultSize="35%" minSize="25%" maxSize="50%">
            {leftPanel}
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="65%">
            {rightPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {/* Keyboard shortcut hints */}
      <ShortcutHintBar />
    </div>
  )
}
