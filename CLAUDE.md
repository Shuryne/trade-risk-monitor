# Trade Risk Monitor

## Overview
每日交易订单风险监控系统 — 纯前端 SPA，用于香港券商合规部门的交易风险检测。

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui (New York style)
- Zustand (state management, localStorage persistence for rule configs)
- Papa Parse (CSV parsing)
- Recharts (charts)
- TanStack Table + React Virtual (data table)
- jsPDF + jsPDF-AutoTable (PDF export)
- Dexie.js (IndexedDB for history)
- Day.js + timezone plugin (HKT/ET conversion)

## Project Structure
```
src/
  types/          # TypeScript interfaces (order, risk, rule)
  utils/          # Constants, timezone, formatters, validators
  services/       # CSV parser, risk engine (11 rules), report generator, storage
  stores/         # Zustand stores (order, risk, ruleConfig, ui)
  components/     # layout/, upload/, dashboard/, detail/, shared/
  pages/          # Upload, Dashboard, Detail, Settings, Report, History, Trend
```

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npx tsc --noEmit` — Type check

## Key Design Decisions
- All data processing is client-side only (no backend)
- CSV parser: `dynamicTyping: false` to control number parsing (千分位 commas)
- Timezone: Day.js timezone plugin handles EST/EDT automatically, no hardcoded +13h
- R005 (price deviation): includes 部分成交 orders
- R006 (wash trading): both sides of the pair are flagged with related_orders
- Rule configs persist to localStorage via Zustand persist middleware
- Analysis sessions auto-save to IndexedDB after each analysis
- Trends page at `/trends` (separate from history)

## Test Data
- `test-data/sample.csv` — PRD appendix sample (9 rows, mixed HK/US, BOM-free)
