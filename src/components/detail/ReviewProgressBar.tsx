import { memo, useMemo } from 'react'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import type { RiskResult } from '@/types/risk'

dayjs.extend(duration)

interface ReviewProgressBarProps {
  results: RiskResult[]
  firstReviewAt: string | null
  lastReviewAt: string | null
  onFilterFollowUp: () => void
}

function formatElapsed(firstReviewAt: string, lastReviewAt: string): string {
  const diff = dayjs(lastReviewAt).diff(dayjs(firstReviewAt))
  const d = dayjs.duration(diff)
  const hours = Math.floor(d.asHours())
  const minutes = d.minutes()
  const seconds = d.seconds()

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export const ReviewProgressBar = memo(function ReviewProgressBar({
  results,
  firstReviewAt,
  lastReviewAt,
  onFilterFollowUp,
}: ReviewProgressBarProps) {
  const stats = useMemo(() => {
    const groups = {
      HIGH: { total: 0, processed: 0 },
      MEDIUM: { total: 0, processed: 0 },
      LOW: { total: 0, processed: 0 },
    }
    let followUpCount = 0

    for (const r of results) {
      const g = groups[r.highest_severity]
      g.total++
      if (r.review_status !== 'PENDING') g.processed++
      if (r.review_status === 'FOLLOW_UP') followUpCount++
    }

    const total = results.length
    const processed =
      groups.HIGH.processed + groups.MEDIUM.processed + groups.LOW.processed
    return { groups, total, processed, followUpCount }
  }, [results])

  const { groups, total, processed, followUpCount } = stats

  const pct = useMemo(
    () => (total > 0 ? Math.round((processed / total) * 100) : 0),
    [processed, total]
  )

  const isComplete = processed === total && total > 0

  const segmentPcts = useMemo(() => {
    if (total === 0) return { high: 0, med: 0, low: 0 }
    return {
      high: (groups.HIGH.total / total) * 100,
      med: (groups.MEDIUM.total / total) * 100,
      low: (groups.LOW.total / total) * 100,
    }
  }, [groups, total])

  const filledPcts = useMemo(() => {
    return {
      high:
        groups.HIGH.total > 0
          ? (groups.HIGH.processed / groups.HIGH.total) * 100
          : 0,
      med:
        groups.MEDIUM.total > 0
          ? (groups.MEDIUM.processed / groups.MEDIUM.total) * 100
          : 0,
      low:
        groups.LOW.total > 0
          ? (groups.LOW.processed / groups.LOW.total) * 100
          : 0,
    }
  }, [groups])

  const elapsedLabel = useMemo(() => {
    if (!firstReviewAt || !lastReviewAt) return null
    return formatElapsed(firstReviewAt, lastReviewAt)
  }, [firstReviewAt, lastReviewAt])

  return (
    <div className="px-4 py-3 border-b space-y-2">
      {/* Top line: count + percentage */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {processed} / {total} ({pct}%)
        </span>
        {isComplete && (
          <span className="text-xs text-green-600">✓ 全部完成</span>
        )}
      </div>

      {/* Segmented progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {/* HIGH segment */}
        {segmentPcts.high > 0 && (
          <div
            style={{ width: `${segmentPcts.high}%` }}
            className="relative bg-red-200"
          >
            <div
              className="absolute inset-y-0 left-0 bg-red-500 transition-all duration-300 ease-in-out"
              style={{ width: `${filledPcts.high}%` }}
            />
          </div>
        )}
        {/* MEDIUM segment */}
        {segmentPcts.med > 0 && (
          <div
            style={{ width: `${segmentPcts.med}%` }}
            className="relative bg-orange-200"
          >
            <div
              className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-300 ease-in-out"
              style={{ width: `${filledPcts.med}%` }}
            />
          </div>
        )}
        {/* LOW segment */}
        {segmentPcts.low > 0 && (
          <div
            style={{ width: `${segmentPcts.low}%` }}
            className="relative bg-yellow-200"
          >
            <div
              className="absolute inset-y-0 left-0 bg-yellow-500 transition-all duration-300 ease-in-out"
              style={{ width: `${filledPcts.low}%` }}
            />
          </div>
        )}
      </div>

      {/* Bottom line: per-severity breakdown + follow-up button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            ●<span className="text-red-500">HIGH</span>{' '}
            {groups.HIGH.processed}/{groups.HIGH.total}
          </span>
          <span>
            ●<span className="text-orange-500">MED</span>{' '}
            {groups.MEDIUM.processed}/{groups.MEDIUM.total}
          </span>
          <span>
            ●<span className="text-yellow-500">LOW</span>{' '}
            {groups.LOW.processed}/{groups.LOW.total}
          </span>
        </div>
        <button
          onClick={onFilterFollowUp}
          className="text-xs text-orange-600 hover:underline"
        >
          ▴ 需跟进: {followUpCount}
        </button>
      </div>

      {/* Completion state */}
      {isComplete && (
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            {elapsedLabel && <span>用时: {elapsedLabel}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onFilterFollowUp}
              className="text-xs px-2 py-1 rounded border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
            >
              查看需跟进
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
