# Detail Page UX Redesign

## Context

Trade Risk Monitor is a client-side SPA used by Hong Kong brokerage compliance teams for daily trade risk review. Compliance officers process **500+ flagged orders per day**, primarily reviewing by severity (HIGH → MEDIUM → LOW).

### Current Pain Points

- Flat list of 500+ orders with no grouping — hard to navigate
- 8-9 filter controls crammed into a single row — breaks on tablets
- Detail panel has 12 fields in a flat grid — no visual hierarchy
- No keyboard navigation — all operations require mouse clicks
- No review progress tracking — officers can't gauge remaining workload
- Fixed 420px left panel width — doesn't adapt to screen sizes

### Design Direction

- Modern clean style (enhanced shadcn/ui, not terminal-dense)
- Grouped review mode matching the severity-first workflow
- Keyboard-driven efficiency for high-volume daily use

### Localization

The UI uses **Chinese** for all user-facing labels and domain terms (consistent with existing codebase). English is used only in code identifiers and this spec document. Mockups in this spec use Chinese labels as the canonical reference.

### Data Model Constraints

The `Order` type has `symbol: string` (code only, e.g., `0700.HK`) and `broker_id: string` (ID only, e.g., `B001`). There are no human-readable name fields for symbols or brokers in the CSV data. All mockups in this spec display these raw identifiers only.

---

## 1. Layout Structure

### Current

```
[Left list 420px fixed] [Right detail flex-1]
```

### Redesigned

```
┌───────────────────────────────────────────────────────┐
│ [Review Progress Bar]                                 │
├────────────────────────┬──────────────────────────────┤
│  [Filter Panel]        │                              │
│  ────────────────────  │     Order Detail Panel       │
│  ▼ HIGH (45)           │                              │
│    ☐ Order card        │                              │
│    ☐ Order card        │                              │
│  ▼ MEDIUM (187)        │                              │
│    ☐ Order card        │                              │
│  ▶ LOW (300) collapsed │                              │
├────────────────────────┤                              │
│  [Batch Action Bar]    │                              │
└────────────────────────┴──────────────────────────────┘
```

### Key Changes

- **Top**: Review progress bar spanning full width — shows global review status segmented by severity
- **Left panel**: Resizable width (default 400px, range 320–600px) via drag handle
- **Filter panel**: Moved above the list, collapsible to a single row
- **Batch action bar**: Fixed at list bottom, appears only when items are selected

### Component: `ReviewProgressBar`

New component placed above the two-panel layout.

```
████████████░░░░░░░░░░░░░░  128 / 532  (24%)
●HIGH 33/45   ●MED 55/187   ●LOW 40/300
▴ Needs follow-up: 8
```

- Segmented color bar: red (HIGH progress), orange (MEDIUM), yellow (LOW)
- Real-time update with animation on each review action
- "Needs follow-up" count as a clickable filter shortcut

### Component: `ResizablePanel`

Use shadcn/ui's `ResizablePanelGroup` (built on `react-resizable-panels`) instead of a custom hook, to stay consistent with the design system:

- `ResizablePanelGroup` with `direction="horizontal"`, `ResizableHandle` between panels
- Left panel: default 35%, min 25%, max 50% (translates to ~400px default on 1200px screen)
- Use `react-resizable-panels`'s built-in `autoSaveId="detail-panel"` for persistence (stores to localStorage automatically — no manual `uiStore` field needed)
- Uses existing `useIsMobile()` hook from `src/hooks/use-mobile.ts` (breakpoint: 768px) to switch to stacked layout on mobile

---

## 2. Grouped List

### Group Header

```
▼ HIGH 严重 (45)                    [全选] [全部标记已审]
  ──────────────────────────────────────────────────
  12 待审  ·  28 已审  ·  5 需跟进
```

- Each severity level is a collapsible group
- Default state: HIGH expanded, MEDIUM expanded, LOW collapsed
- Group header shows review progress summary (pending / reviewed / follow-up)
- Group header has batch action shortcuts (select all, mark all reviewed)
- Empty groups (after filtering) are automatically hidden
- Collapse/expand with smooth animation (150ms)

### Order Card (List Item)

```
☐  ┃  0700.HK                   买入    14:32
   ┃  A00123 · B001             ¥2,450,000
   ┃  R001 大额交易  R003 集中交易         ● 待审查
```

- **Left border**: Color by severity (red/orange/yellow) — retained from current design
- **Row 1**: Symbol code, side (buy/sell), time — primary identification. `open_close` is deliberately omitted from cards for compactness (visible in detail panel Zone 1).
- **Row 2**: Account ID + broker ID, amount — context (raw IDs as per data model)
- **Row 3**: Triggered rule tags + review status dot — decision info
- **Card height**: ~96px (up from 82px) for better readability
- **Active item**: Blue left highlight bar + light blue background
- **Review status dots**: Gray (pending), green (reviewed), orange (follow-up)

### Sorting

Default sort within each group: **amount descending** (largest risk exposure first).

> **Behavioral change note**: The current list renders results in risk engine output order (CSV row order). This redesign changes the default to amount-descending within each severity group. This applies within each group, not globally.

Sortable alternatives (via dropdown in group header or a sort control):
- By time (newest first)
- By rule count (most rules triggered first)

### Severity Filter Interaction

Since the list is already grouped by severity, the **severity dropdown is removed from filters**. Users collapse/expand groups instead of filtering by severity. If a user needs to focus on a single severity, they collapse the other two groups. This avoids the confusing state of "filtered to HIGH but seeing groups for MEDIUM and LOW."

### Virtualization Strategy

Use a **single `@tanstack/react-virtual` virtualizer** with mixed row types (not three separate virtualizers):

- The flat item array contains both group headers and order cards
- `estimateSize` returns different heights: ~48px for group headers, ~96px for order cards
- Group headers use `position: sticky` within the scroll container
- Collapsed groups contribute only their header row to the flat array (items omitted)
- This is the same pattern as the current single-virtualizer approach, extended with header rows

---

## 3. Filter System

### Two-Tier Structure

**Quick filters (always visible):**

```
[🔍 Search symbol/account...]   [Market ▼]  [Side ▼]  [⚙ More]
```

- Search box: fuzzy match on symbol code, account ID, broker ID (fields available in Order type)
- Market dropdown: All / HK / US
- Side dropdown: All / Buy / Sell
- "More" button to toggle advanced panel

**Advanced filter panel (expandable):**

```
规则类型: [R001 ▼]        账户: [搜索输入...]
经纪人:   [搜索输入...]   订单状态: [全部/成交/已撤單/...]
审查状态: [全部/待审/已审/需跟进/误报]

[重置全部]                                   [收起]
```

- Expands below the quick filter bar, above the grouped list
- 2-column grid layout
- **订单状态 (Order Status)**: Filters by `order_status` field (成交, 已撤單, etc.) — renamed from the ambiguous "Status" in the current filter bar
- **审查状态 (Review Status)**: New filter for review workflow states (`PENDING` / `REVIEWED` / `FOLLOW_UP` / `FALSE_POSITIVE`)

### Active Filter Indicators

When filters are active, display tags below the quick filter bar:

```
Active filters: [Market: HK ×] [Side: Buy ×] [Rule: R001 ×]   Clear all
```

- Each tag has a `×` to remove individually
- "More" button shows a badge count when advanced filters are active
- Filtering affects all groups; empty groups auto-hide

### Search Behavior

- Real-time filtering with 200ms debounce
- Empty state: "No matching results — try adjusting your filters"
- Search clears on `Esc` key press

### State Management

All filter state stored in `uiStore` (Zustand). Current uiStore already tracks most filters — extend with:
- `reviewStatusFilter: 'ALL' | 'PENDING' | 'REVIEWED' | 'FOLLOW_UP' | 'FALSE_POSITIVE'` (uses existing `ReviewStatus` enum values, plus `'ALL'`)
- `sortBy: 'amount' | 'time' | 'ruleCount'`
- `advancedFiltersOpen: boolean`

Note: The existing `detailFilters.severity` field is **removed** since severity is now handled by group collapse/expand state (stored in component state, not Zustand — resets to default on page re-entry, which is intentional). Panel width is persisted via `react-resizable-panels`'s `autoSaveId` (not in uiStore).

---

## 4. Detail Panel Redesign

### Current

12 fields in a flat grid, rules as small tags, related trades in tabs — all at the same visual priority.

### Redesigned: 4-Zone Card Layout

```
┌─ 订单详情 ───────────────────────────────────────┐
│                                                   │
│  ┌─ 订单概要 ──────────────────────────────────┐  │
│  │  0700.HK                       HIGH 严重     │  │
│  │  买入 · 开仓 · 港股                          │  │
│  │                                              │  │
│  │  金额        数量        价格       时间      │  │
│  │  ¥2,450,000  5,000股    ¥490.00   14:32     │  │
│  │                                              │  │
│  │  账户 A00123  经纪人 B001  订单号 ORD-789    │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ 触发规则 (3) ──────────────────────────────┐  │
│  │  ⚠ R001 大额交易                             │  │
│  │  交易金额 ¥2,450,000 超过阈值 ¥2,000,000     │  │
│  │                                              │  │
│  │  ⚠ R003 集中交易                             │  │
│  │  该账户当日同标的累计交易占比 15.2%            │  │
│  │                                              │  │
│  │  ⚠ R006 对倒交易                             │  │
│  │  关联订单: ORD-456 (卖出) [点击跳转]          │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ 关联交易 ──── [同账户] [同标的] ────────────┐  │
│  │  (Tab 切换，表格内容)                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ 审查操作 ──────────────────────────────────┐  │
│  │  [✓ 已审] [⚑ 需跟进] [✗ 误报] [备注...]    │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Zone 1: Order Summary

- **Header line**: Symbol code (text-lg font-semibold) + severity badge (right-aligned)
- **Sub-header**: Side + open/close + market (text-sm muted)
- **Key metrics row**: Amount, quantity, price, time — in a 4-column grid with labels above values. Values use `font-mono tabular-nums` for alignment. Amount uses `text-base font-semibold`.
- **Secondary info**: Account ID, broker ID, order ID — smaller text (text-xs muted), single row. These are raw IDs from the data model (no name lookup).

### Zone 2: Triggered Rules

- Each rule in its own bordered section within the card
- Rule icon: `⚠` with severity color
- Rule name: `font-semibold`
- **Trigger description**: The specific reason this rule fired (e.g., actual value vs threshold). This is the key improvement — currently rules show only their name.
- Related order links (R006 wash trading): clickable, jumps to and selects that order in the list
- Collapsible if > 3 rules (show first 3, "Show N more" link)

### Zone 3: Related Trades

- Tab component: "同账户" / "同标的"
- Compact table: Time, Side, Symbol, Qty, Amount, Status
- Max 10 rows shown, sorted by time descending (most recent first), "Show all N" link if more
- Table has sticky header
- Pulls from `orderStore.orders` (includes non-risk-flagged orders for context)

### Zone 4: Review Actions

- **Sticky at panel bottom** — always visible without scrolling
- Four actions matching existing `ReviewStatus` enum:
  - **已审�� (Mark Reviewed)**: Primary button — confirms order has been reviewed and is acceptable
  - **需跟进 (Follow-up)**: Outline button — order needs further investigation
  - **误报 (False Positive)**: Ghost/subtle button — risk flag is a false alarm
  - **备注 (Note)**: Text input that expands on focus
- Note field: single-line input, expands to 3-line textarea on focus, saves on blur, max 500 characters. Notes are standalone (not tied to a specific review action). Notes are **not** searchable via the search filter (to keep search fast).
- After marking any status, button changes to active state with undo option via toast (5s timeout)
- Toast notifications use `sonner` (new dependency) — consistent with shadcn/ui ecosystem

### Empty State

When no order is selected, show:

```
┌─────────────────────────────────────────────┐
│                                             │
│        📋 Select an order to review         │
│                                             │
│   Today's summary:                          │
│   532 flagged orders · 45 HIGH · 187 MED    │
│                                             │
│   Tip: Use ↑↓ to navigate, Enter to review │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5. Keyboard Navigation & Batch Operations

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Previous / next order (crosses group boundaries) |
| `←` / `→` | Collapse / expand current group |
| `Enter` | Mark current order as "Reviewed" |
| `F` | Mark current order as "Follow-up" |
| `Space` | Toggle checkbox (for batch operations) |
| `/` | Focus search box |
| `Esc` | Clear search / deselect / close advanced filters |
| `Shift+↑/↓` | Extend selection (multi-select continuous range) |

### Implementation Details

- Focus management via a `useKeyboardNavigation` custom hook
- Current focus index stored in component state (not Zustand — it's ephemeral)
- Focus item has a visible **focus ring** (`ring-2 ring-primary`)
- Keyboard navigation auto-scrolls the focused item to the **center of the visible area**
- Detail panel updates automatically when focus changes via keyboard
- Keyboard shortcuts are only active when the **list panel** has focus (not when search input, note field, or other form elements are focused)
- **Focus flow**: `Tab` moves focus from list to search box to filters; `Esc` from any input returns focus to the list. Clicking a list item also returns focus to the list.

### Quick Review Flow

When pressing `Enter` to mark as reviewed:
1. Current order marked as "Reviewed"
2. Focus **automatically advances to the next pending order** (skips already-reviewed items)
3. Progress bar animates increment
4. Toast notification: "已审查 +1" (subtle, auto-dismiss 1.5s)

This enables a rapid `review → Enter → review → Enter` workflow.

### Batch Operations

**Batch action bar** (fixed at list bottom, visible when items are checked):

```
已选 12 项    [✓ 批量已审]  [⚑ 批量跟进]  [✗ 批量误报]  [取消选择]
```

- Group header "全选" checks all items in that severity group
- `Shift+click` for range selection (from last checked to current)
- Batch actions show a **confirmation dialog** (shadcn `AlertDialog` for proper focus trapping and `Esc` to cancel): "确定将 12 条订单标记为已审查？ [确定] [取消]"
- After batch operation: toast "已将 12 条订单标记为已审查", all items uncheck, progress updates

### Shortcut Hint Bar

Persistent hint bar at the bottom of the page (dismissible):

```
↑↓ Navigate  Enter Reviewed  F Follow-up  Space Select  / Search
```

- Can be dismissed via `×` button
- Dismissal state persisted in `uiStore`
- Optionally shown on first visit, hidden after dismissal

---

## 6. Review Progress & Visual Feedback

### Progress Bar Component

Located at the top of the Detail page, spanning full width:

```
████████████░░░░░░░░░░░░░░  128 / 532  (24%)
●HIGH 33/45   ●MED 55/187   ●LOW 40/300
▴ Needs follow-up: 8
```

- **Segmented bar**: Three colored segments (red, orange, yellow) proportional to each group's total count. Filled portion represents reviewed items.
- **Animation**: Smooth width transition (300ms ease) on each review action
- **Follow-up count**: Clickable — sets `reviewStatusFilter` to `'FOLLOW_UP'`. Clicking again resets to `'ALL'` (toggle behavior).
- **Completion state**: When all reviewed, bar turns green with checkmark

### List Item Visual States

| State | Visual Treatment |
|-------|-----------------|
| Pending | Normal text, gray dot `●` on right |
| Reviewed | Muted text (`text-muted-foreground`), green dot `●`, slight opacity reduction |
| Follow-up | Normal text, orange dot `●`, orange right-edge accent bar |
| False Positive | Muted text + strikethrough on rule tags, light gray dot `●` with `×` icon |
| Active (viewing) | Blue left highlight bar, light blue background (`bg-primary/5`) |
| Focused (keyboard) | Focus ring (`ring-2 ring-primary`) |
| Selected (checkbox) | Checkbox filled, subtle background tint (`bg-muted/50`) |

- Reviewed items are **visually de-emphasized but not hidden** — pending items naturally stand out more
- Multiple states can combine (e.g., selected + reviewed, active + follow-up)

### Group Completion

When all items in a severity group have a non-PENDING status (i.e., REVIEWED, FOLLOW_UP, or FALSE_POSITIVE — all count as "processed"):

> **Progress counting rule**: Progress numerator = count of items with status in {REVIEWED, FOLLOW_UP, FALSE_POSITIVE}. This applies to both the top progress bar and per-group counters.

```
✓ HIGH 严重 (45/45) — 全部完成
```

- Group header gets a green checkmark icon
- Header text color changes to muted green
- Group auto-collapses (with animation) to save space
- **Focus after group completion**: Focus automatically moves to the first pending item in the next group. If all groups are complete, focus stays on the last reviewed item.

### Full Completion State

When all 532 orders are reviewed:

```
┌─ Review Complete ✓ ──────────────────────────────────┐
│  ████████████████████████████████  532 / 532  (100%) │
│  All orders reviewed · 8 need follow-up · ~2h15m     │
│                          [Export Report] [View Follow-ups] │
└──────────────────────────────────────────────────────┘
```

- Progress bar area transforms to completion state
- Shows total time estimate (calculated from first review action to last)
- Quick action buttons: Export report / Filter to follow-up items

### Review State Persistence

Review data is stored in `riskStore` (Zustand) with the following additions to the store:

```typescript
// Added to riskStore
notes: Record<string, string>;           // orderId → note text (max 500 chars)
reviewTimestamps: Record<string, string>; // orderId → ISO 8601 timestamp of last status change
firstReviewAt: string | null;            // ISO timestamp of the first review action in this session
lastReviewAt: string | null;             // ISO timestamp of the most recent review action
```

- `review_status` remains on `RiskResult` (existing field)
- `reviewTimestamps` records when each order's status was last changed — used for the completion time calculation
- `firstReviewAt` / `lastReviewAt` are session-level — used to compute elapsed time in the completion state
- All review data included in report export (PDF/CSV) as additional columns
- Persisted across page navigation within the session
- Saved to IndexedDB when session is saved to history — **requires extending `AnalysisSession` type** with `notes`, `reviewTimestamps`, `firstReviewAt`, `lastReviewAt` fields

---

## 7. Mobile & Tablet Adaptation

While mobile is a separate phase, the Detail page redesign should be **responsive-ready**:

- **< 768px** (matches existing `MOBILE_BREAKPOINT` in `src/hooks/use-mobile.ts`): Stacked layout (list full-width above, detail below as a slide-up sheet)
- **768–1024px**: Side-by-side with left panel at minimum width (25%)
- **> 1024px**: Full two-panel layout with resizable divider

The resize handle is hidden on mobile (< 768px) where panels stack vertically. The existing `useIsMobile()` hook is used for this check — no new breakpoint constants.

---

## 8. New & Modified Components

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ReviewProgressBar` | `src/components/detail/` | Top progress bar with segmented display |
| `GroupHeader` | `src/components/detail/` | Collapsible severity group header with actions |
| `OrderCard` | `src/components/detail/` | Redesigned list item (replaces current RiskOrderItem) |
| `QuickFilters` | `src/components/detail/` | Always-visible filter bar |
| `AdvancedFilters` | `src/components/detail/` | Expandable filter panel |
| `ActiveFilterTags` | `src/components/detail/` | Active filter indicator chips |
| `ReviewActions` | `src/components/detail/` | Sticky review action bar in detail panel |
| `ShortcutHintBar` | `src/components/detail/` | Keyboard shortcut hints |
| `useKeyboardNavigation` | `src/hooks/` | Custom hook for keyboard navigation logic |

### Modified Components

| Component | Changes |
|-----------|---------|
| `DetailPage` | New layout structure, progress bar, keyboard event handling |
| `RiskOrderList` | Grouped rendering, group headers, updated virtualization |
| `FilterBar` | Replaced by QuickFilters + AdvancedFilters |
| `OrderDetailPanel` | 4-zone card layout, sticky review actions, empty state |

### Modified Stores

| Store | Changes |
|-------|---------|
| `uiStore` | Add: `reviewStatusFilter`, `sortBy`, `advancedFiltersOpen`, `shortcutHintsVisible`. Remove: `detailFilters.severity` (replaced by group collapse). |
| `riskStore` | Add: `notes` map (orderId → string), `reviewTimestamps` map (orderId → ISO timestamp), `firstReviewAt`, `lastReviewAt` |
| `AnalysisSession` type | Add: `notes`, `reviewTimestamps`, `firstReviewAt`, `lastReviewAt` fields for IndexedDB persistence |

### New Dependencies

| Package | Purpose |
|---------|---------|
| `sonner` | Toast notifications — install via `npx shadcn@latest add sonner` |
| `react-resizable-panels` | Resizable panel layout — install via `npx shadcn@latest add resizable` |

Both should be installed via `shadcn add` (not bare `npm install`) to scaffold the wrapper components in `src/components/ui/`.

---

## 9. Out of Scope (Future Phases)

The following were identified as pain points but are deferred to subsequent design phases:

1. **Workflow continuity** — Guided flow from upload → analysis → review → export
2. **Dashboard visualization** — Improved charts with drill-down to Detail page
3. **Mobile/tablet full optimization** — Dedicated mobile layouts for all pages
4. **Dark mode toggle** — CSS variables exist but no user-facing toggle
5. **Settings page reorganization** — Group rules by market/type
6. **History/Trends unification** — Clearer navigation between related views
