# Detail Page UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Detail page with grouped severity review, keyboard navigation, resizable panels, and review progress tracking for 500+ order daily compliance workflows.

**Architecture:** Extend existing two-panel layout with shadcn Resizable, add severity-grouped virtualized list using single @tanstack/react-virtual virtualizer with mixed row types, implement keyboard-driven review flow via custom hook, and add review progress/notes/timestamps to riskStore.

**Tech Stack:** React 19 (per package.json; CLAUDE.md says 18 but is outdated), TypeScript, Tailwind CSS v4, shadcn/ui (New York), Zustand 5, @tanstack/react-virtual 3, sonner (new), react-resizable-panels (new)

**Spec:** `docs/superpowers/specs/2026-03-22-detail-page-ux-design.md`

**Build note:** Tasks 3-11 create new components and rewrite existing ones with new props interfaces. The project **will not type-check** between Tasks 5-11 and Task 12 (the integration task). This is expected — type-check steps in Tasks 3-4, 9-11 verify the new files in isolation; Tasks 5-8 skip type-check because they break DetailPage's old imports. Task 12 resolves all type errors by wiring the new components together.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/ui/resizable.tsx` | shadcn Resizable primitives (auto-generated via `shadcn add`) |
| `src/components/ui/sonner.tsx` | shadcn Sonner toast wrapper (auto-generated via `shadcn add`) |
| `src/components/ui/alert-dialog.tsx` | shadcn AlertDialog for batch confirmations (auto-generated via `shadcn add`) |
| `src/components/detail/ReviewProgressBar.tsx` | Top progress bar with segmented severity display |
| `src/components/detail/GroupHeader.tsx` | Collapsible severity group header with batch actions |
| `src/components/detail/OrderCard.tsx` | Redesigned 3-row list item replacing RiskOrderItem |
| `src/components/detail/QuickFilters.tsx` | Always-visible search + market + side filters |
| `src/components/detail/AdvancedFilters.tsx` | Expandable panel with rule/account/broker/status filters |
| `src/components/detail/ActiveFilterTags.tsx` | Removable filter indicator chips |
| `src/components/detail/ReviewActions.tsx` | Sticky 4-button review bar + notes input |
| `src/components/detail/BatchActionBar.tsx` | Bottom batch operations bar |
| `src/components/detail/ShortcutHintBar.tsx` | Dismissible keyboard shortcut hints |
| `src/hooks/useKeyboardNavigation.ts` | Keyboard shortcut management for list navigation |

### Modified Files
| File | Changes |
|------|---------|
| `src/types/risk.ts` | Extend `AnalysisSession` with notes/timestamps fields |
| `src/stores/riskStore.ts` | Add notes, reviewTimestamps, firstReviewAt, lastReviewAt |
| `src/stores/uiStore.ts` | Add reviewStatusFilter, sortBy, advancedFiltersOpen, shortcutHintsVisible, broker filter; remove severity filter |
| `src/utils/formatters.ts` | Add `formatTime` helper |
| `src/components/detail/RiskOrderList.tsx` | Full rewrite: grouped virtualization with mixed row types |
| `src/components/detail/OrderDetailPanel.tsx` | Rewrite to 4-zone card layout |
| `src/pages/DetailPage.tsx` | New layout with ResizablePanelGroup, progress bar, keyboard hook integration |
| `src/App.tsx` | Add Toaster component from sonner |

### Deleted Files
| File | Reason |
|------|--------|
| `src/components/detail/FilterBar.tsx` | Replaced by QuickFilters + AdvancedFilters |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json` (auto via shadcn CLI)
- Create: `src/components/ui/resizable.tsx` (auto-generated)
- Create: `src/components/ui/sonner.tsx` (auto-generated)
- Create: `src/components/ui/alert-dialog.tsx` (auto-generated)
- Modify: `src/App.tsx` (add Toaster)

- [ ] **Step 1: Install shadcn components**

```bash
npx shadcn@latest add resizable sonner alert-dialog
```

This installs `react-resizable-panels`, `sonner`, and scaffolds UI wrappers in `src/components/ui/`.

- [ ] **Step 2: Add Toaster to App.tsx**

Read `src/App.tsx`. The app uses `BrowserRouter` (not `RouterProvider`). Add the Toaster as a sibling inside the `BrowserRouter`:

```tsx
import { Toaster } from '@/components/ui/sonner'

// Inside the BrowserRouter, as a sibling of Routes:
<Toaster position="bottom-right" richColors />
```

- [ ] **Step 3: Add formatTime helper**

In `src/utils/formatters.ts`, add:

```typescript
/** Extract HH:mm from ISO datetime string */
export function formatTime(isoTime: string): string {
  return dayjs(isoTime).format('HH:mm');
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "build: add shadcn resizable, sonner, alert-dialog components and formatTime helper"
```

---

## Task 2: Extend Types and Stores

**Files:**
- Modify: `src/types/risk.ts:24-40` (AnalysisSession)
- Modify: `src/stores/riskStore.ts` (add notes, timestamps, actions)
- Modify: `src/stores/uiStore.ts` (add new filters, remove severity)

- [ ] **Step 1: Extend AnalysisSession type**

In `src/types/risk.ts`, add fields to `AnalysisSession`:

```typescript
export interface AnalysisSession {
  // ... existing fields ...

  // Review tracking (added for detail page redesign)
  notes: Record<string, string>;            // orderId → note text
  reviewTimestamps: Record<string, string>;  // orderId → ISO 8601 timestamp
  firstReviewAt: string | null;
  lastReviewAt: string | null;
}
```

- [ ] **Step 2: Extend riskStore**

In `src/stores/riskStore.ts`, add new state fields and actions:

```typescript
interface RiskState {
  // ... existing fields ...
  notes: Record<string, string>;
  reviewTimestamps: Record<string, string>;
  firstReviewAt: string | null;
  lastReviewAt: string | null;

  // New actions
  setNote: (orderId: string, note: string) => void;
  updateReviewStatus: (orderId: string, status: ReviewStatus) => void; // enhance existing
  batchUpdateReviewStatus: (orderIds: string[], status: ReviewStatus) => void; // enhance existing
}
```

Enhance `updateReviewStatus` to also record timestamp:

```typescript
updateReviewStatus: (orderId, status) =>
  set((state) => {
    const now = new Date().toISOString();
    return {
      results: state.results.map((r) =>
        r.order.order_id === orderId ? { ...r, review_status: status } : r
      ),
      reviewTimestamps: { ...state.reviewTimestamps, [orderId]: now },
      firstReviewAt: state.firstReviewAt ?? now,
      lastReviewAt: now,
    };
  }),
```

Add `setNote`:

```typescript
setNote: (orderId, note) =>
  set((state) => ({
    notes: { ...state.notes, [orderId]: note },
  })),
```

Initialize new fields in default state and `clear()`:

```typescript
notes: {},
reviewTimestamps: {},
firstReviewAt: null,
lastReviewAt: null,
```

Also enhance `batchUpdateReviewStatus` similarly to record timestamps for each order.

- [ ] **Step 3: Extend uiStore**

In `src/stores/uiStore.ts`:

1. Remove `severity` from `detailFilters`
2. Add new fields:

```typescript
interface UiState {
  detailFilters: {
    // severity: removed — now handled by group collapse
    ruleId: string | null;
    account: string | null;
    symbol: string | null;
    side: string | null;
    market: string | null;
    status: string | null;         // order_status filter
    broker: string | null;         // NEW: broker_id filter (for advanced filters)
    search: string;
  };
  reviewStatusFilter: 'ALL' | 'PENDING' | 'REVIEWED' | 'FOLLOW_UP' | 'FALSE_POSITIVE';
  sortBy: 'amount' | 'time' | 'ruleCount';
  advancedFiltersOpen: boolean;
  shortcutHintsVisible: boolean;

  // New actions
  setReviewStatusFilter: (filter: UiState['reviewStatusFilter']) => void;
  setSortBy: (sort: UiState['sortBy']) => void;
  setAdvancedFiltersOpen: (open: boolean) => void;
  setShortcutHintsVisible: (visible: boolean) => void;
  // existing actions remain
}
```

Defaults:

```typescript
reviewStatusFilter: 'ALL',
sortBy: 'amount',
advancedFiltersOpen: false,
shortcutHintsVisible: true,
```

- [ ] **Step 4: Update any code referencing `detailFilters.severity`**

Search for `severity` usage in DetailPage.tsx and FilterBar.tsx. DetailPage.tsx has a filter that checks `severity`. Remove this filter branch and any related Select UI (it will be replaced by group collapse in later tasks).

```bash
# Search for severity filter usage
grep -rn "severity" src/pages/DetailPage.tsx src/components/detail/
```

Update the filtering logic in DetailPage.tsx to no longer filter by severity. Keep other filters intact.

- [ ] **Step 5: Verify type check passes**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor(stores): extend riskStore and uiStore for review tracking

Add notes, reviewTimestamps, firstReviewAt, lastReviewAt to riskStore.
Add reviewStatusFilter, sortBy, advancedFiltersOpen to uiStore.
Remove severity from detailFilters (replaced by group collapse).
Extend AnalysisSession type for IndexedDB persistence."
```

---

## Task 3: OrderCard Component

**Files:**
- Create: `src/components/detail/OrderCard.tsx`

- [ ] **Step 1: Create OrderCard component**

New 3-row card replacing the inline `RiskOrderItem` from current `RiskOrderList.tsx`.

```tsx
// src/components/detail/OrderCard.tsx
import { memo } from 'react';
import type { RiskResult, ReviewStatus } from '@/types/risk';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { formatAmount, formatTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  result: RiskResult;
  isActive: boolean;
  isFocused: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
  onClick: (e: React.MouseEvent, id: string) => void; // for Shift+click range selection
}

const severityBorderColor: Record<string, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-orange-400',
  LOW: 'border-l-yellow-400',
};

const reviewStatusDot: Record<ReviewStatus, { bg: string; icon?: boolean }> = {
  PENDING: { bg: 'bg-gray-400' },
  REVIEWED: { bg: 'bg-green-500' },
  FOLLOW_UP: { bg: 'bg-orange-500' },
  FALSE_POSITIVE: { bg: 'bg-gray-300', icon: true }, // shows × icon overlay
};

export const OrderCard = memo(function OrderCard({
  result, isActive, isFocused, isChecked, onSelect, onToggleCheck, onClick,
}: OrderCardProps) {
  const { order, flags, highest_severity, review_status } = result;
  const isProcessed = review_status !== 'PENDING';
  const isFalsePositive = review_status === 'FALSE_POSITIVE';
  const isFollowUp = review_status === 'FOLLOW_UP';

  return (
    <div
      className={cn(
        'relative flex items-start gap-2 px-3 py-2.5 border-l-4 cursor-pointer transition-colors',
        severityBorderColor[highest_severity],
        isActive && 'bg-primary/5 border-l-primary',
        isFocused && 'ring-2 ring-primary ring-inset',
        isProcessed && 'opacity-60',
        !isActive && !isFocused && 'hover:bg-muted/50',
        // FOLLOW_UP: orange right-edge accent bar (per spec)
        isFollowUp && 'border-r-2 border-r-orange-500',
      )}
      onClick={(e) => {
        if (e.shiftKey) {
          onClick(e, order.order_id); // Shift+click for range selection
        } else {
          onSelect(order.order_id);
        }
      }}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isChecked}
        onCheckedChange={(checked) => onToggleCheck(order.order_id, !!checked)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Row 1: Symbol, Side, Time */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium truncate">{order.symbol}</span>
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className={order.side === '買入' ? 'text-red-600' : 'text-green-600'}>
              {order.side}
            </span>
            <span className="text-muted-foreground">
              {formatTime(order.order_time)}
            </span>
          </div>
        </div>

        {/* Row 2: Account + Broker, Amount */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{order.account_id} · {order.broker_id}</span>
          <span className="font-mono tabular-nums font-medium text-foreground shrink-0">
            {formatAmount(order.order_amount, order.currency)}
          </span>
        </div>

        {/* Row 3: Rule tags + Review status */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {flags.slice(0, 3).map((f) => (
              <span
                key={f.rule_id}
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground',
                  // FALSE_POSITIVE: strikethrough on rule tags (per spec)
                  isFalsePositive && 'line-through',
                )}
              >
                {f.rule_id}
              </span>
            ))}
            {flags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{flags.length - 3}</span>
            )}
          </div>
          {/* Review status dot — FALSE_POSITIVE shows × icon overlay */}
          <span className="relative shrink-0">
            <span className={cn('block w-2 h-2 rounded-full', reviewStatusDot[review_status].bg)} />
            {reviewStatusDot[review_status].icon && (
              <X className="absolute -top-0.5 -left-0.5 w-3 h-3 text-gray-500" />
            )}
          </span>
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Verify type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/detail/OrderCard.tsx
git commit -m "feat(detail): add OrderCard component with 3-row layout"
```

---

## Task 4: GroupHeader Component

**Files:**
- Create: `src/components/detail/GroupHeader.tsx`

- [ ] **Step 1: Create GroupHeader component**

```tsx
// src/components/detail/GroupHeader.tsx
import { memo } from 'react';
import type { RuleSeverity } from '@/types/rule';
import type { ReviewStatus } from '@/types/risk';
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
      {/* Main row */}
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
              checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
              onCheckedChange={onSelectAll}
              className="mr-1"
            />
            <Button variant="ghost" size="xs" onClick={onMarkAllReviewed}>
              全部标记已审
            </Button>
          </div>
        )}
      </div>

      {/* Progress sub-row */}
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
```

- [ ] **Step 2: Verify type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/detail/GroupHeader.tsx
git commit -m "feat(detail): add GroupHeader with collapse/expand and batch actions"
```

---

## Task 5: Rewrite RiskOrderList with Grouped Virtualization

**Files:**
- Modify: `src/components/detail/RiskOrderList.tsx` (full rewrite)

This is the most complex task. The current flat virtualized list becomes a grouped list with mixed row types (headers + cards).

- [ ] **Step 1: Design the grouped data structure**

The list needs a flat array of items for the virtualizer, where each item is either a group header or an order card. Define the types:

```typescript
type ListRow =
  | { type: 'header'; severity: RuleSeverity; results: RiskResult[] }
  | { type: 'item'; result: RiskResult };
```

- [ ] **Step 2: Rewrite RiskOrderList**

Replace the entire content of `src/components/detail/RiskOrderList.tsx`. Key changes:

1. Accept `results` already filtered (from DetailPage)
2. Group results by `highest_severity` (HIGH → MEDIUM → LOW)
3. Sort within each group by `sortBy` from uiStore
4. Build flat `ListRow[]` array based on collapse state
5. Single virtualizer with `estimateSize` returning 48 for headers, 96 for items
6. Render `GroupHeader` or `OrderCard` based on row type

```tsx
interface RiskOrderListProps {
  results: RiskResult[];
  selectedId: string | null;
  focusedIndex: number;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
  onBatchMark: (ids: string[], status: ReviewStatus) => void;
}
```

Collapse state: `useState<Record<RuleSeverity, boolean>>` defaulting to `{ HIGH: true, MEDIUM: true, LOW: false }`.

Sorting: use `useUiStore` to read `sortBy` and sort within each group accordingly:
- `'amount'`: `order.order_amount` descending
- `'time'`: `order.order_time` descending
- `'ruleCount'`: `flags.length` descending

Group auto-complete detection: if all items in a group are non-PENDING, show completion state and auto-collapse (with a `useEffect` that runs when review statuses change).

**Collapse/expand animation** (150ms per spec): Use the existing `Collapsible` component from `src/components/ui/collapsible.tsx` to wrap each group's items. This provides built-in open/close animation. The `CollapsibleContent` handles height transition automatically.

- [ ] **Step 3: Wire up selection and virtualization**

- Use `useVirtualizer` with the flat rows array
- `estimateSize`: header = 48, item = 96
- `scrollToIndex` when `focusedIndex` changes (passed from parent)
- Group header "全选" toggles all items in that severity group
- Group header "全部标记已审" calls `onBatchMark` with all order IDs in that group

- [ ] **Step 4: Commit** (type check will fail until Task 12 wires new props — this is expected)

```bash
git commit -m "refactor(detail): rewrite RiskOrderList with severity-grouped virtualization

Replace flat list with grouped layout using single virtualizer with
mixed row types. Groups are collapsible with animation, sorted by
amount/time/ruleCount. Auto-collapse on group completion."
```

---

## Task 6: Filter System (QuickFilters + AdvancedFilters + ActiveFilterTags)

**Files:**
- Create: `src/components/detail/QuickFilters.tsx`
- Create: `src/components/detail/AdvancedFilters.tsx`
- Create: `src/components/detail/ActiveFilterTags.tsx`
- Delete: `src/components/detail/FilterBar.tsx`

- [ ] **Step 1: Create QuickFilters**

Always-visible bar with: search input, market select, side select, "more" toggle button.

```tsx
// src/components/detail/QuickFilters.tsx
interface QuickFiltersProps {
  onToggleAdvanced: () => void;
  advancedOpen: boolean;
  activeAdvancedCount: number; // badge on "more" button
}
```

- Search: `Input` with search icon, debounce 200ms, calls `setDetailFilter('search', value)`
- Market: `Select` with options All/HK/US
- Side: `Select` with options All/買入/賣出
- "更多筛选" button with badge count when advanced filters active

- [ ] **Step 2: Create AdvancedFilters**

Expandable panel below QuickFilters. 2-column grid.

```tsx
// src/components/detail/AdvancedFilters.tsx
interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}
```

Fields:
- 规则类型: Select from `DEFAULT_RULE_CONFIGS` (R001-R011)
- 账户: Input with `setDetailFilter('account', value)`
- 经纪人 (broker_id): Input with `setDetailFilter` — use a text input since broker_id cardinality may vary
- 订单状态: Select with `VALID_ORDER_STATUSES` options
- 审查状态: Select with ALL/PENDING/REVIEWED/FOLLOW_UP/FALSE_POSITIVE (calls `setReviewStatusFilter`)
- 重置全部 button, 收起 button

Use the existing `Collapsible` / `CollapsibleContent` from `src/components/ui/collapsible.tsx` for the expand/collapse animation.

- [ ] **Step 3: Create ActiveFilterTags**

Shows active filter chips below filters.

```tsx
// src/components/detail/ActiveFilterTags.tsx
```

Read all filter values from `useUiStore`. For each non-null/non-default filter (including `reviewStatusFilter` if not 'ALL'), render a badge with `×` button that calls `setDetailFilter(key, null)` or `setReviewStatusFilter('ALL')`. "清除全部" button calls `resetDetailFilters()` + `setReviewStatusFilter('ALL')`.

- [ ] **Step 4: Commit** (FilterBar.tsx deletion deferred to Task 14 to avoid breaking DetailPage imports)

```bash
git commit -m "feat(detail): add two-tier filter system (QuickFilters + AdvancedFilters + ActiveFilterTags)"
```

---

## Task 7: ReviewActions Component

**Files:**
- Create: `src/components/detail/ReviewActions.tsx`

- [ ] **Step 1: Create ReviewActions**

Sticky bottom bar in the detail panel with 4 review action buttons + note input.

```tsx
// src/components/detail/ReviewActions.tsx
interface ReviewActionsProps {
  result: RiskResult;
  note: string;
  onStatusChange: (orderId: string, status: ReviewStatus) => void;
  onNoteChange: (orderId: string, note: string) => void;
}
```

Key behaviors:
- 4 buttons: 已审 (primary), 需跟进 (outline), 误报 (ghost), each calls `onStatusChange`
- Active button state: current `review_status` determines which button shows active style
- **Two toast modes** (per spec):
  - **Button click** (from detail panel): Show toast with "撤销" undo action, 5s auto-dismiss. Undo calls `onStatusChange(orderId, 'PENDING')`.
  - **Keyboard Enter** (quick review flow): Show brief "已审查 +1" toast, 1.5s auto-dismiss, no undo button.
  - Expose a `source?: 'button' | 'keyboard'` parameter to distinguish. Or accept an `isQuickReview` prop.
- If a new status action on the same order occurs within undo window, dismiss previous toast (use `toast.dismiss(toastId)`).
- Note: `Textarea` that starts as single-line (`rows={1}`), expands to 3 rows on focus. Max 500 chars. Save on blur via `onNoteChange`.

- [ ] **Step 2: Verify type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/detail/ReviewActions.tsx
git commit -m "feat(detail): add ReviewActions with status buttons, notes, and undo toast"
```

---

## Task 8: Rewrite OrderDetailPanel with 4-Zone Layout

**Files:**
- Modify: `src/components/detail/OrderDetailPanel.tsx` (significant rewrite)

- [ ] **Step 1: Restructure into 4 zones**

Rewrite `OrderDetailPanel` with clear zone separation:

**Zone 1 — Order Summary card:**
- Header: symbol code (text-lg font-semibold) + RiskBadge (right)
- Sub-header: side + open_close + market (text-sm muted)
- 4-column metrics grid: 金额, 数量, 价格, ���间 (labels above, values below, font-mono)
- Secondary info row: account_id, broker_id, order_id (text-xs muted)

**Zone 2 — Triggered Rules card:**
- Each flag in its own bordered section
- Rule icon (AlertTriangle) with severity color
- Rule name (font-semibold) + description below
- Related order links: clickable, calls `onSelectOrder(relatedOrderId)`
- Collapsible if > 3 rules

**Zone 3 — Related Trades card:**
- Keep existing Tabs with "同账户" / "同标的"
- Max 10 rows sorted by time descending
- "显示全部 N 条" link if more

**Zone 4 — ReviewActions (imported):**
- Sticky at bottom via `sticky bottom-0`
- Import from `./ReviewActions`

**Empty state:**
When no result is provided, show summary + keyboard hint.

- [ ] **Step 2: Update props interface**

```typescript
interface OrderDetailPanelProps {
  result: RiskResult | null;        // null = empty state
  allOrders: Order[];               // for related trades
  riskResults: RiskResult[];        // for navigating to related orders
  note: string;
  onStatusChange: (orderId: string, status: ReviewStatus) => void;
  onNoteChange: (orderId: string, note: string) => void;
  onSelectOrder: (orderId: string) => void;  // for jumping to related orders
  summaryStats?: { total: number; high: number; medium: number; low: number };
}
```

- [ ] **Step 3: Commit** (type check will fail until Task 12 wires new props — this is expected)

```bash
git commit -m "refactor(detail): rewrite OrderDetailPanel with 4-zone card layout

Zone 1: Order summary with metrics grid.
Zone 2: Triggered rules with descriptions and related order links.
Zone 3: Related trades tabs (same account / same symbol).
Zone 4: ReviewActions with status buttons and notes.
Add empty state when no order selected."
```

---

## Task 9: ReviewProgressBar Component

**Files:**
- Create: `src/components/detail/ReviewProgressBar.tsx`

- [ ] **Step 1: Create ReviewProgressBar**

```tsx
// src/components/detail/ReviewProgressBar.tsx
interface ReviewProgressBarProps {
  results: RiskResult[];
  firstReviewAt: string | null;
  lastReviewAt: string | null;
  onFilterFollowUp: () => void;  // toggles reviewStatusFilter
}
```

Implementation:
- Count total, processed (non-PENDING), by severity
- Segmented bar: three colored div segments proportional to group size, fill % = processed/total per group
- Width transition: `transition-all duration-300 ease-in-out`
- Per-severity breakdown: `●HIGH 33/45  ●MED 55/187  ●LOW 40/300`
- Follow-up count: clickable, calls `onFilterFollowUp`
- Completion state: when all processed, bar turns green, shows elapsed time from `firstReviewAt` to `lastReviewAt`, shows "导出报告" and "查看需跟进" buttons

Use `useMemo` to compute all counts from results array.

- [ ] **Step 2: Verify type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/detail/ReviewProgressBar.tsx
git commit -m "feat(detail): add ReviewProgressBar with segmented severity progress"
```

---

## Task 10: Keyboard Navigation Hook

**Files:**
- Create: `src/hooks/useKeyboardNavigation.ts`

- [ ] **Step 1: Create useKeyboardNavigation hook**

```tsx
// src/hooks/useKeyboardNavigation.ts
interface UseKeyboardNavigationOptions {
  /** Flat array of order IDs in display order (excluding group headers) */
  orderIds: string[];
  /** Currently selected order ID */
  selectedId: string | null;
  /** Callback to select an order */
  onSelect: (id: string) => void;
  /** Callback to mark as reviewed */
  onMarkReviewed: (id: string) => void;
  /** Callback to mark as follow-up */
  onMarkFollowUp: (id: string) => void;
  /** Callback to toggle checkbox */
  onToggleCheck: (id: string) => void;
  /** Callback to focus search */
  onFocusSearch: () => void;
  /** Get the next pending order ID after the current one */
  getNextPendingId: (currentId: string) => string | null;
  /** Whether keyboard shortcuts are active (false when inputs focused) */
  enabled: boolean;
}

interface UseKeyboardNavigationReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}
```

Key logic:
- Listen for `keydown` events on the **document** (not just container) for global shortcuts
- `↑/↓`: Move focusedIndex, call `onSelect` with new ID, scroll into view
- `←/→`: Toggle group collapse (needs `onToggleGroup` callback from parent)
- `Enter`: Call `onMarkReviewed`, then advance to `getNextPendingId`
- `F`: Call `onMarkFollowUp`
- `Space`: Call `onToggleCheck`
- `/`: Call `onFocusSearch`, `preventDefault` to avoid typing `/` in search
- `Esc`: Context-dependent: if search focused → clear search + return focus to list; if advanced filters open → close panel; otherwise → clear selection
- `Shift+↑/↓`: Extend selection range (toggle check on each item traversed)

**Focus flow management** (per spec):
- `Tab` from list → moves focus to search box → to filter controls (use `tabIndex` ordering)
- `Esc` from any input/textarea → returns focus to the list container via `listRef.current?.focus()`
- Clicking a list item also returns focus to the list
- The hook tracks `isListFocused` by listening to `focus`/`blur` events on the list container

Guard: Keyboard shortcuts only fire when the list panel has focus. Check `document.activeElement` — if it's an `input`, `textarea`, or `select`, only `Esc` (to return to list) and `/` (already handled) are active. All other shortcuts are suppressed.

- [ ] **Step 2: Verify type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useKeyboardNavigation.ts
git commit -m "feat(detail): add useKeyboardNavigation hook for keyboard-driven review"
```

---

## Task 11: BatchActionBar and ShortcutHintBar

**Files:**
- Create: `src/components/detail/BatchActionBar.tsx`
- Create: `src/components/detail/ShortcutHintBar.tsx`

- [ ] **Step 1: Create BatchActionBar**

Fixed at bottom of list panel, visible only when `checkedIds.size > 0`.

```tsx
interface BatchActionBarProps {
  checkedCount: number;
  onBatchMark: (status: ReviewStatus) => void;
  onClearSelection: () => void;
}
```

- Shows: "已选 N 项" + 3 action buttons (批量已审, 批量跟进, 批量误报) + 取消选择
- Each action button opens `AlertDialog` (installed in Task 1 via `shadcn add alert-dialog`) for confirmation: "确定将 N 条订单标记为已审查？ [确定] [取消]"
- AlertDialog provides proper focus trapping and `Esc` to cancel
- After action completes: show toast via sonner, call `onClearSelection`
- **Single-item review (Enter key, button click) does NOT use AlertDialog** — only batch operations need confirmation. This asymmetry is intentional: single = reversible via undo toast, batch = harder to undo.

- [ ] **Step 2: Create ShortcutHintBar**

```tsx
// src/components/detail/ShortcutHintBar.tsx
```

- Reads `shortcutHintsVisible` from uiStore
- Fixed at bottom of page (full width below the two panels)
- Shows: `↑↓ 切换  Enter 已审  F 跟进  Space 勾选  / 搜索`
- Dismiss `×` button that calls `setShortcutHintsVisible(false)`

- [ ] **Step 3: Verify type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(detail): add BatchActionBar with AlertDialog and ShortcutHintBar"
```

---

## Task 12: DetailPage Integration

**Files:**
- Modify: `src/pages/DetailPage.tsx` (significant rewrite)

This is the final assembly task that wires all new components together.

- [ ] **Step 1: Rewrite DetailPage layout**

New layout structure:

```tsx
<div className="flex flex-col h-full">
  {/* Review Progress Bar */}
  <ReviewProgressBar ... />

  {/* Resizable two-panel layout */}
  <ResizablePanelGroup direction="horizontal" autoSaveId="detail-panel" className="flex-1">
    <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
      {/* Left panel */}
      <div className="flex flex-col h-full">
        <QuickFilters ... />
        <AdvancedFilters ... />
        <ActiveFilterTags ... />
        <div className="flex-1 overflow-hidden">
          <RiskOrderList ... />
        </div>
        <BatchActionBar ... />
      </div>
    </ResizablePanel>

    <ResizableHandle withHandle />

    <ResizablePanel defaultSize={65}>
      {/* Right panel */}
      <OrderDetailPanel ... />
    </ResizablePanel>
  </ResizablePanelGroup>

  {/* Keyboard hint bar */}
  <ShortcutHintBar />
</div>
```

- [ ] **Step 2: Wire state management**

Connect all the pieces:

1. **Filtering logic**: Read `detailFilters` + `reviewStatusFilter` from uiStore, filter `riskStore.results`:

```typescript
const filteredResults = useMemo(() => {
  let filtered = results;
  const { search, market, side, ruleId, account, broker, status } = detailFilters;

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((r) =>
      r.order.symbol.toLowerCase().includes(q) ||
      r.order.account_id.toLowerCase().includes(q) ||
      r.order.broker_id.toLowerCase().includes(q)
    );
  }
  if (market) filtered = filtered.filter((r) => r.order.market === market);
  if (side) filtered = filtered.filter((r) => r.order.side === side);
  if (ruleId) filtered = filtered.filter((r) => r.flags.some((f) => f.rule_id === ruleId));
  if (account) filtered = filtered.filter((r) => r.order.account_id.includes(account));
  if (broker) filtered = filtered.filter((r) => r.order.broker_id.includes(broker));
  if (status) filtered = filtered.filter((r) => r.order.order_status === status);

  // Review status filter (separate from detailFilters)
  if (reviewStatusFilter !== 'ALL') {
    filtered = filtered.filter((r) => r.review_status === reviewStatusFilter);
  }

  return filtered;
}, [results, detailFilters, reviewStatusFilter]);
```

2. **Selection + Shift+click**: Keep `selectedId`, `checkedIds`, and `lastCheckedId` in component state. Auto-select first result if selected disappears from filtered list. Implement Shift+click range selection:

```typescript
const handleShiftClick = (e: React.MouseEvent, id: string) => {
  if (!lastCheckedId) return;
  const ids = filteredOrderIds; // flat array of all order IDs in display order
  const start = ids.indexOf(lastCheckedId);
  const end = ids.indexOf(id);
  const range = ids.slice(Math.min(start, end), Math.max(start, end) + 1);
  setCheckedIds((prev) => new Set([...prev, ...range]));
};
```

3. **Keyboard hook**: Initialize `useKeyboardNavigation` with:
   - `orderIds`: flat array of filtered order IDs (respecting group collapse)
   - `onSelect`, `onMarkReviewed`, `onMarkFollowUp`, `onToggleCheck`
   - `getNextPendingId`: find next order after current with `review_status === 'PENDING'`
   - `listRef`: ref to the list container for focus management

4. **Progress bar**: Pass `results`, `firstReviewAt`, `lastReviewAt` from riskStore. `onFilterFollowUp` toggles `reviewStatusFilter` between `'FOLLOW_UP'` and `'ALL'`.

5. **Notes**: Read `notes[selectedId]` from riskStore, pass to ReviewActions + OrderDetailPanel.

6. **Mobile layout**: Use `useIsMobile()` — if mobile, render stacked layout instead of ResizablePanelGroup.

- [ ] **Step 3: Clean up imports**

Remove old FilterBar import. Add all new component imports. Ensure no dead imports.

- [ ] **Step 4: Verify type check and build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

Test the following flows:
1. Upload `test-data/sample.csv`, navigate to Detail
2. Groups visible (HIGH expanded, MEDIUM expanded, LOW collapsed)
3. Click an order card → detail panel shows 4-zone layout
4. Keyboard ↑/↓ navigation works
5. Enter marks as reviewed, auto-advances
6. Filters work (quick + advanced)
7. Batch select + mark works
8. Progress bar updates
9. Panel resize works
10. Shortcut hint bar visible and dismissible

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(detail): integrate all redesigned components into DetailPage

Wire ReviewProgressBar, ResizablePanelGroup, QuickFilters, AdvancedFilters,
ActiveFilterTags, grouped RiskOrderList, 4-zone OrderDetailPanel,
BatchActionBar, ShortcutHintBar, and keyboard navigation.
Complete Detail page UX redesign per spec."
```

---

## Task 13: Update History/Session Persistence

**Files:**
- Modify: `src/services/storageService.ts` (Dexie CRUD wrapper)
- Modify: Call site(s) that construct `AnalysisSession` objects — find via: `grep -rn "saveSession\|AnalysisSession" src/`

- [ ] **Step 1: Find where sessions are constructed**

```bash
grep -rn "saveSession\|new.*AnalysisSession\|notes.*reviewTimestamps" src/
```

The `storageService.ts` is a thin Dexie wrapper that calls `db.sessions.put(session)`. The `AnalysisSession` object is constructed in the component/page that calls `saveSession()`. Find that call site and extend the session object:

```typescript
const session: AnalysisSession = {
  // ... existing fields ...
  notes: useRiskStore.getState().notes,
  reviewTimestamps: useRiskStore.getState().reviewTimestamps,
  firstReviewAt: useRiskStore.getState().firstReviewAt,
  lastReviewAt: useRiskStore.getState().lastReviewAt,
};
```

- [ ] **Step 2: Restore review data on session load**

Find where historical sessions are loaded (likely in HistoryPage or a restore function). When restoring, set the new fields on riskStore if they exist in the loaded session. Handle backward compatibility for old sessions that don't have these fields (default to `{}` / `null`).

- [ ] **Step 3: Verify type check and build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(history): persist review notes and timestamps to IndexedDB sessions"
```

---

## Task 14: Final Cleanup

**Files:**
- Various (dead code removal, import cleanup)

- [ ] **Step 1: Remove dead code**

- Delete `src/components/detail/FilterBar.tsx` (replaced by QuickFilters + AdvancedFilters in Task 6)
- Remove the old `RiskOrderItem` from `RiskOrderList.tsx` (replaced by `OrderCard`)
- Remove unused imports across all modified files
- Remove `severity` from `resetDetailFilters` initial state in uiStore (if not already done in Task 2)
- Verify no other files import `FilterBar` (DetailPage.tsx should have been updated in Task 12)

- [ ] **Step 2: Verify full build and type check**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(detail): remove dead code from pre-redesign components"
```

---

## Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Install dependencies (resizable, sonner) | None |
| 2 | Extend types and stores | None |
| 3 | OrderCard component | None |
| 4 | GroupHeader component | None |
| 5 | Rewrite RiskOrderList (grouped virtualization) | 3, 4 |
| 6 | Filter system (Quick + Advanced + Tags) | 2 |
| 7 | ReviewActions component | 2 |
| 8 | Rewrite OrderDetailPanel (4-zone layout) | 7 |
| 9 | ReviewProgressBar | 2 |
| 10 | Keyboard navigation hook | None |
| 11 | BatchActionBar + ShortcutHintBar | 2 |
| 12 | DetailPage integration (wire everything) | 1-11 |
| 13 | Update history/session persistence | 2 |
| 14 | Final cleanup | 12, 13 |

Tasks 1-4, 6, 7, 9, 10, 11 can be parallelized. Task 5 needs 3+4. Task 8 needs 7. Task 12 is the final assembly requiring all prior tasks. Task 13 can run after 2. Task 14 is final cleanup.
