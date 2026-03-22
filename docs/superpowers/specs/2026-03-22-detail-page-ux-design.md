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

The left panel becomes resizable:

- Drag handle on the right edge of the left panel (vertical bar, cursor: col-resize)
- Default: 400px, min: 320px, max: 600px
- Width persisted in `uiStore` (Zustand)
- On screens < 768px: full-width stacked layout (list above, detail below)

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
☐  ┃  0700.HK 中国移动          买入    14:32
   ┃  A00123 · 张经纪           ¥2,450,000
   ┃  R001 大额交易  R003 集中交易         ● 待审查
```

- **Left border**: Color by severity (red/orange/yellow) — retained from current design
- **Row 1**: Symbol + name, side (buy/sell), time — primary identification
- **Row 2**: Account + broker, amount — context
- **Row 3**: Triggered rule tags + review status dot — decision info
- **Card height**: ~96px (up from 82px) for better readability
- **Active item**: Blue left highlight bar + light blue background
- **Review status dots**: Gray (pending), green (reviewed), orange (follow-up)

### Sorting

Default sort within each group: **amount descending** (largest risk exposure first).

Sortable alternatives (via dropdown in group header or a sort control):
- By time (newest first)
- By rule count (most rules triggered first)

### Virtualization

Continue using `react-virtual` for each group's item list. Each group header is a sticky element within the scroll container.

---

## 3. Filter System

### Two-Tier Structure

**Quick filters (always visible):**

```
[🔍 Search symbol/account...]   [Market ▼]  [Side ▼]  [⚙ More]
```

- Search box: fuzzy match on symbol code, symbol name, account number, broker name
- Market dropdown: All / HK / US
- Side dropdown: All / Buy / Sell
- "More" button to toggle advanced panel

**Advanced filter panel (expandable):**

```
Rule type: [R001 ▼]     Account: [search input...]
Broker:    [search input...]  Status: [All / Pending / Reviewed / Follow-up]

[Reset all]                                  [Collapse]
```

- Expands below the quick filter bar, above the grouped list
- 2-column grid layout
- Status filter includes review states

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
- `reviewStatus: 'all' | 'pending' | 'reviewed' | 'followUp'`
- `sortBy: 'amount' | 'time' | 'ruleCount'`
- `advancedFiltersOpen: boolean`
- `leftPanelWidth: number`

---

## 4. Detail Panel Redesign

### Current

12 fields in a flat grid, rules as small tags, related trades in tabs — all at the same visual priority.

### Redesigned: 4-Zone Card Layout

```
┌─ Order Detail ───────────────────────────────────┐
│                                                   │
│  ┌─ Order Summary ─────────────────────────────┐  │
│  │  0700.HK 中国移动              HIGH 严重     │  │
│  │  买入 · 开仓 · 港股                          │  │
│  │                                              │  │
│  │  Amount      Qty        Price      Time      │  │
│  │  ¥2,450,000  5,000      ¥490.00   14:32     │  │
│  │                                              │  │
│  │  Account A00123  Broker 张三  Order ORD-789  │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ Triggered Rules (3) ────────────────────────┐  │
│  │  ⚠ R001 Large Transaction                    │  │
│  │  Amount ¥2,450,000 exceeds threshold ¥2M     │  │
│  │                                              │  │
│  │  ⚠ R003 Concentrated Trading                 │  │
│  │  Same-day same-symbol ratio: 15.2%           │  │
│  │                                              │  │
│  │  ⚠ R006 Wash Trading                         │  │
│  │  Related order: ORD-456 (Sell) [click→jump]  │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ Related Trades ── [Same Account] [Same Sym] ┐  │
│  │  (Tab switch, table content)                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ Review Actions ─────────────────────────────┐  │
│  │  [✓ Mark Reviewed]  [⚑ Follow-up]  [Note...] │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Zone 1: Order Summary

- **Header line**: Symbol code + name (text-lg font-semibold) + severity badge (right-aligned)
- **Sub-header**: Side + open/close + market (text-sm muted)
- **Key metrics row**: Amount, quantity, price, time — in a 4-column grid with labels above values. Values use `font-mono tabular-nums` for alignment. Amount uses `text-base font-semibold`.
- **Secondary info**: Account, broker, order ID — smaller text (text-xs muted), single row

### Zone 2: Triggered Rules

- Each rule in its own bordered section within the card
- Rule icon: `⚠` with severity color
- Rule name: `font-semibold`
- **Trigger description**: The specific reason this rule fired (e.g., actual value vs threshold). This is the key improvement — currently rules show only their name.
- Related order links (R006 wash trading): clickable, jumps to and selects that order in the list
- Collapsible if > 3 rules (show first 3, "Show N more" link)

### Zone 3: Related Trades

- Tab component: "Same Account" / "Same Symbol"
- Compact table: Time, Side, Symbol, Qty, Amount, Status
- Max 10 rows shown, "Show all N" link if more
- Table has sticky header

### Zone 4: Review Actions

- **Sticky at panel bottom** — always visible without scrolling
- Three actions: Mark Reviewed (primary button), Follow-up (outline button), Note (text input that expands on focus)
- Note field: single-line input, expands to textarea on focus, saves on blur
- After marking reviewed, button changes to "✓ Reviewed" (disabled state) with undo option (5s timeout)

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
- Keyboard shortcuts are only active when the Detail page is focused (not when search input or note field is focused)

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
Selected: 12 items    [✓ Batch Review]  [⚑ Batch Follow-up]  [✕ Cancel]
```

- Group header "Select All" checks all items in that severity group
- `Shift+click` for range selection (from last checked to current)
- Batch actions show a **confirmation dialog**: "Mark 12 orders as reviewed? [Confirm] [Cancel]"
- After batch operation: toast "12 orders marked as reviewed", all items uncheck, progress updates

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
- **Follow-up count**: Clickable — applies a filter to show only follow-up items
- **Completion state**: When all reviewed, bar turns green with checkmark

### List Item Visual States

| State | Visual Treatment |
|-------|-----------------|
| Pending | Normal text, gray dot `●` on right |
| Reviewed | Muted text (`text-muted-foreground`), green dot `●`, slight opacity reduction |
| Follow-up | Normal text, orange dot `●`, orange right-edge accent bar |
| Active (viewing) | Blue left highlight bar, light blue background (`bg-primary/5`) |
| Focused (keyboard) | Focus ring (`ring-2 ring-primary`) |
| Selected (checkbox) | Checkbox filled, subtle background tint (`bg-muted/50`) |

- Reviewed items are **visually de-emphasized but not hidden** — pending items naturally stand out more
- Multiple states can combine (e.g., selected + reviewed, active + follow-up)

### Group Completion

When all items in a severity group are reviewed:

```
✓ HIGH 严重 (45/45) — 全部完成
```

- Group header gets a green checkmark icon
- Header text color changes to muted green
- Group auto-collapses (with animation) to save space

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

- Review status (pending/reviewed/follow-up) and notes stored in `riskStore` (Zustand)
- Included in report export (PDF/CSV) as additional columns
- Persisted across page navigation within the session
- Saved to IndexedDB when session is saved to history

---

## 7. Mobile & Tablet Adaptation

While mobile is a separate phase, the Detail page redesign should be **responsive-ready**:

- **< 768px**: Stacked layout (list full-width above, detail below as a slide-up sheet)
- **768–1024px**: Side-by-side with left panel at minimum width (320px)
- **> 1024px**: Full two-panel layout with resizable divider

The left panel resize handle is hidden on mobile (< 768px) where the panel takes full width.

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
| `useResizablePanel` | `src/hooks/` | Custom hook for panel resize drag handling |

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
| `uiStore` | Add: `reviewStatus`, `sortBy`, `advancedFiltersOpen`, `leftPanelWidth`, `shortcutHintsVisible` |
| `riskStore` | Add: `notes` map (orderId → string), review timestamp tracking |

---

## 9. Out of Scope (Future Phases)

The following were identified as pain points but are deferred to subsequent design phases:

1. **Workflow continuity** — Guided flow from upload → analysis → review → export
2. **Dashboard visualization** — Improved charts with drill-down to Detail page
3. **Mobile/tablet full optimization** — Dedicated mobile layouts for all pages
4. **Dark mode toggle** — CSS variables exist but no user-facing toggle
5. **Settings page reorganization** — Group rules by market/type
6. **History/Trends unification** — Clearer navigation between related views
