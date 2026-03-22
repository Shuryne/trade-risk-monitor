import { memo, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { ReviewStatus } from '@/types/risk'

interface BatchActionBarProps {
  checkedCount: number
  onBatchMark: (status: ReviewStatus) => void
  onClearSelection: () => void
}

interface BatchAction {
  status: ReviewStatus
  label: string
  description: string
  toastMessage: string
}

const BATCH_ACTIONS: BatchAction[] = [
  {
    status: 'REVIEWED',
    label: '批量已审',
    description: '确定将 {count} 条订单标记为已审查？',
    toastMessage: '已将 {count} 条订单标记为已审查',
  },
  {
    status: 'FOLLOW_UP',
    label: '批量跟进',
    description: '确定将 {count} 条订单标记为跟进？',
    toastMessage: '已将 {count} 条订单标记为跟进',
  },
  {
    status: 'FALSE_POSITIVE',
    label: '批量误报',
    description: '确定将 {count} 条订单标记为误报？',
    toastMessage: '已将 {count} 条订单标记为误报',
  },
]

interface BatchActionDialogProps {
  action: BatchAction
  checkedCount: number
  onBatchMark: (status: ReviewStatus) => void
  onClearSelection: () => void
}

const BatchActionDialog = memo(function BatchActionDialog({
  action,
  checkedCount,
  onBatchMark,
  onClearSelection,
}: BatchActionDialogProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onBatchMark(action.status)
    toast(action.toastMessage.replace('{count}', String(checkedCount)))
    onClearSelection()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="outline">
          {action.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认批量操作</AlertDialogTitle>
          <AlertDialogDescription>
            {action.description.replace('{count}', String(checkedCount))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})

export const BatchActionBar = memo(function BatchActionBar({
  checkedCount,
  onBatchMark,
  onClearSelection,
}: BatchActionBarProps) {
  if (checkedCount === 0) return null

  return (
    <div className="bg-background border-t p-2 flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-1">
        已选 {checkedCount} 项
      </span>
      {BATCH_ACTIONS.map((action) => (
        <BatchActionDialog
          key={action.status}
          action={action}
          checkedCount={checkedCount}
          onBatchMark={onBatchMark}
          onClearSelection={onClearSelection}
        />
      ))}
      <Button size="xs" variant="ghost" onClick={onClearSelection}>
        取消选择
      </Button>
    </div>
  )
})
