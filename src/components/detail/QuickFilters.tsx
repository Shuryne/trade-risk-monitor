import { memo, useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'
import { Search, SlidersHorizontal } from 'lucide-react'

const ALL_VALUE = '__all__'

interface QuickFiltersProps {
  searchRef?: React.RefObject<HTMLInputElement | null>;
  onToggleAdvanced: () => void;
  advancedOpen: boolean;
  activeAdvancedCount: number;
}

export const QuickFilters = memo(function QuickFilters({
  searchRef,
  onToggleAdvanced,
  advancedOpen,
  activeAdvancedCount,
}: QuickFiltersProps) {
  const { detailFilters, setDetailFilter } = useUiStore()

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(detailFilters.search)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local input in sync if store value is cleared externally
  useEffect(() => {
    if (detailFilters.search === '') {
      setSearchInput('')
    }
  }, [detailFilters.search])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearchInput(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDetailFilter('search', value)
    }, 200)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b">
      {/* Search */}
      <div className="relative flex-1 min-w-0 max-w-64">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={searchRef}
          placeholder="搜索股票/账户..."
          value={searchInput}
          onChange={handleSearchChange}
          className="h-8 pl-7 text-xs"
        />
      </div>

      {/* Market select */}
      <CompactSelect
        placeholder="市场"
        value={detailFilters.market}
        onValueChange={v => setDetailFilter('market', v)}
        options={[
          { value: 'HK', label: '港股' },
          { value: 'US', label: '美股' },
        ]}
      />

      {/* Side select */}
      <CompactSelect
        placeholder="方向"
        value={detailFilters.side}
        onValueChange={v => setDetailFilter('side', v)}
        options={[
          { value: '買入', label: '買入' },
          { value: '賣出', label: '賣出' },
        ]}
      />

      {/* More filters button */}
      <Button
        variant={advancedOpen ? 'secondary' : 'outline'}
        size="sm"
        onClick={onToggleAdvanced}
        className="h-8 text-xs gap-1.5 shrink-0"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        更多筛选
        {activeAdvancedCount > 0 && (
          <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {activeAdvancedCount}
          </span>
        )}
      </Button>
    </div>
  )
})

function CompactSelect({
  placeholder,
  value,
  onValueChange,
  options,
}: {
  placeholder: string;
  value: string | null;
  onValueChange: (v: string | null) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value ?? ''}
      onValueChange={v => onValueChange(v === ALL_VALUE ? null : v)}
    >
      <SelectTrigger className="h-8 w-auto min-w-[80px] text-xs gap-1 px-2">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>全部</SelectItem>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
