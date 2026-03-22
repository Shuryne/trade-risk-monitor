import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { OrderDetailPanel } from './OrderDetailPanel'
import type { RiskResult, ReviewStatus } from '@/types/risk'
import { useRiskStore } from '@/stores/riskStore'
import { useUiStore } from '@/stores/uiStore'
import { formatDateTime, formatAmount } from '@/utils/formatters'
import { SEVERITY_WEIGHT } from '@/utils/constants'
import { ChevronDown, ChevronRight } from 'lucide-react'

const reviewStatusLabels: Record<ReviewStatus, string> = {
  PENDING: '待审阅',
  REVIEWED: '已审阅',
  FOLLOW_UP: '需跟进',
  FALSE_POSITIVE: '误报',
}

export function RiskOrderTable() {
  const { results, batchUpdateReviewStatus } = useRiskStore()
  const { detailFilters } = useUiStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 应用筛选
  const filteredResults = useMemo(() => {
    let filtered = results

    if (detailFilters.severity) {
      filtered = filtered.filter(r => r.highest_severity === detailFilters.severity)
    }
    if (detailFilters.ruleId) {
      filtered = filtered.filter(r => r.flags.some(f => f.rule_id === detailFilters.ruleId))
    }
    if (detailFilters.market) {
      filtered = filtered.filter(r => r.order.market === detailFilters.market)
    }
    if (detailFilters.side) {
      filtered = filtered.filter(r => r.order.side === detailFilters.side)
    }
    if (detailFilters.account) {
      filtered = filtered.filter(r => r.order.account_id === detailFilters.account)
    }
    if (detailFilters.symbol) {
      filtered = filtered.filter(r => r.order.symbol === detailFilters.symbol)
    }
    if (detailFilters.status) {
      filtered = filtered.filter(r => r.order.order_status === detailFilters.status)
    }
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

  const columns: ColumnDef<RiskResult>[] = useMemo(() => [
    {
      id: 'select',
      header: () => null,
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.order.order_id)}
          onCheckedChange={checked => {
            const next = new Set(selectedIds)
            if (checked) next.add(row.original.order.order_id)
            else next.delete(row.original.order.order_id)
            setSelectedIds(next)
          }}
        />
      ),
      size: 32,
    },
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => {
        const isExpanded = expandedId === row.original.order.order_id
        return (
          <button
            onClick={() => setExpandedId(isExpanded ? null : row.original.order.order_id)}
            className="p-1"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )
      },
      size: 32,
    },
    {
      accessorFn: r => r.highest_severity,
      id: 'severity',
      header: '风险等级',
      cell: ({ row }) => <RiskBadge severity={row.original.highest_severity} />,
      sortingFn: (a, b) => (SEVERITY_WEIGHT[a.original.highest_severity] ?? 0) - (SEVERITY_WEIGHT[b.original.highest_severity] ?? 0),
    },
    {
      accessorFn: r => r.order.order_time,
      id: 'time',
      header: '下单时间',
      cell: ({ row }) => <span className="text-xs">{formatDateTime(row.original.order.order_time)}</span>,
    },
    {
      accessorFn: r => r.order.account_id,
      id: 'account',
      header: '账户',
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.order.account_id}</span>,
    },
    {
      accessorFn: r => r.order.symbol,
      id: 'symbol',
      header: '标的',
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.order.symbol}</span>,
    },
    {
      accessorFn: r => r.order.side,
      id: 'side',
      header: '方向',
      cell: ({ row }) => <span className="text-xs">{row.original.order.side}</span>,
    },
    {
      accessorFn: r => r.order.order_amount,
      id: 'amount',
      header: '委托金额',
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {formatAmount(row.original.order.order_amount, row.original.order.currency)}
        </span>
      ),
    },
    {
      accessorFn: r => r.order.market,
      id: 'market',
      header: '市场',
      cell: ({ row }) => <span className="text-xs">{row.original.order.market}</span>,
    },
    {
      accessorFn: r => r.flags.length,
      id: 'rules',
      header: '触发规则数',
      cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.flags.length}</span>,
    },
    {
      accessorFn: r => r.review_status,
      id: 'reviewStatus',
      header: '审阅状态',
      cell: ({ row }) => (
        <span className="text-xs">{reviewStatusLabels[row.original.review_status]}</span>
      ),
    },
  ], [expandedId, selectedIds])

  const table = useReactTable({
    data: filteredResults,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleBatchMark = (status: ReviewStatus) => {
    batchUpdateReviewStatus([...selectedIds], status)
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-3">
      {/* 批量操作 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <span className="text-xs">已选 {selectedIds.size} 项：</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBatchMark('REVIEWED')}>
            标记已审阅
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBatchMark('FOLLOW_UP')}>
            标记需跟进
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBatchMark('FALSE_POSITIVE')}>
            标记误报
          </Button>
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="text-xs cursor-pointer select-none whitespace-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {results.length === 0 ? '暂无风险订单' : '没有匹配筛选条件的订单'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="group">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  {/* 展开详情行 */}
                  {expandedId === row.original.order.order_id && (
                    <TableCell colSpan={columns.length} className="p-0">
                      <OrderDetailPanel result={row.original} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        共 {filteredResults.length} 条风险订单
        {filteredResults.length !== results.length && `（总计 ${results.length} 条）`}
      </p>
    </div>
  )
}
