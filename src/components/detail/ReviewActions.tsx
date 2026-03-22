import { memo, useRef, useState } from 'react';
import { Check, Flag, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { RiskResult, ReviewStatus } from '@/types/risk';

interface ReviewActionsProps {
  result: RiskResult;
  note: string;
  isQuickReview?: boolean;
  onStatusChange: (orderId: string, status: ReviewStatus) => void;
  onNoteChange: (orderId: string, note: string) => void;
}

interface ActionButton {
  label: string;
  status: ReviewStatus;
  variant: 'default' | 'outline' | 'ghost';
  icon: React.ReactNode;
}

const ACTION_BUTTONS: ActionButton[] = [
  {
    label: '已审',
    status: 'REVIEWED',
    variant: 'default',
    icon: <Check className="size-4" />,
  },
  {
    label: '需跟进',
    status: 'FOLLOW_UP',
    variant: 'outline',
    icon: <Flag className="size-4" />,
  },
  {
    label: '误报',
    status: 'FALSE_POSITIVE',
    variant: 'ghost',
    icon: <X className="size-4" />,
  },
];

const STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: '待审',
  REVIEWED: '已审',
  FOLLOW_UP: '需跟进',
  FALSE_POSITIVE: '误报',
};

const ReviewActions = memo(function ReviewActions({
  result,
  note,
  isQuickReview = false,
  onStatusChange,
  onNoteChange,
}: ReviewActionsProps) {
  const orderId = result.order.order_id;
  const currentStatus = result.review_status;

  // Track the active toast ID for each order so we can dismiss before showing a new one
  const toastIdRef = useRef<string | number | null>(null);

  // Local textarea state for expansion on focus
  const [textareaRows, setTextareaRows] = useState(1);
  const [localNote, setLocalNote] = useState(note);

  const handleStatusClick = (status: ReviewStatus) => {
    // Toggle: clicking the active status reverts to PENDING
    const nextStatus: ReviewStatus = currentStatus === status ? 'PENDING' : status;

    onStatusChange(orderId, nextStatus);

    if (nextStatus === 'PENDING') {
      // Toggled off — dismiss any existing toast, no new one needed
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      return;
    }

    if (isQuickReview) {
      // Brief toast for keyboard quick-review, no undo
      toast('已审查 +1', { duration: 1500 });
    } else {
      // Dismiss any previous toast for this order before showing a new one
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
      }

      const label = STATUS_LABELS[nextStatus];
      const id = toast(`已标记为${label}`, {
        action: {
          label: '撤销',
          onClick: () => {
            onStatusChange(orderId, 'PENDING');
          },
        },
        duration: 5000,
      });

      toastIdRef.current = id;
    }
  };

  const handleNoteBlur = () => {
    setTextareaRows(1);
    onNoteChange(orderId, localNote);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNote(e.target.value);
  };

  return (
    <div className="sticky bottom-0 border-t bg-background p-3 space-y-2">
      <div className="flex gap-2">
        {ACTION_BUTTONS.map(({ label, status, variant, icon }) => {
          const isActive = currentStatus === status;
          return (
            <Button
              key={status}
              variant={isActive ? 'default' : variant}
              size="sm"
              onClick={() => handleStatusClick(status)}
              className={
                isActive && variant !== 'default'
                  ? 'ring-2 ring-primary ring-offset-1'
                  : undefined
              }
            >
              {icon}
              {label}
            </Button>
          );
        })}
      </div>
      <textarea
        rows={textareaRows}
        maxLength={500}
        placeholder="添加备注..."
        value={localNote}
        onChange={handleNoteChange}
        onFocus={() => setTextareaRows(3)}
        onBlur={handleNoteBlur}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
      />
    </div>
  );
});

export { ReviewActions };
export type { ReviewActionsProps };
