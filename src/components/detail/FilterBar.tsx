import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'
import { X, Search } from 'lucide-react'
import { DEFAULT_RULE_CONFIGS } from '@/utils/constants'

const ALL_VALUE = '__all__'

export function FilterBar() {
  const { detailFilters, setDetailFilter, resetDetailFilters } = useUiStore()
  const hasFilters = Object.values(detailFilters).some(v => v !== null && v !== '')

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="搜索订单号、账户、标的、经纪人号..."
          value={detailFilters.search}
          onChange={e => setDetailFilter('search', e.target.value)}
          className="h-8 w-56 pl-7 text-xs"
        />
      </div>

      <CompactSelect
        placeholder="风险等级"
        value={detailFilters.severity}
        onValueChange={v => setDetailFilter('severity', v)}
        options={[
          { value: 'HIGH', label: '高风险' },
          { value: 'MEDIUM', label: '中风险' },
          { value: 'LOW', label: '低风险' },
        ]}
      />

      <CompactSelect
        placeholder="风险规则"
        value={detailFilters.ruleId}
        onValueChange={v => setDetailFilter('ruleId', v)}
        options={DEFAULT_RULE_CONFIGS.map(r => ({ value: r.rule_id, label: `${r.rule_id} ${r.name}` }))}
      />

      <CompactSelect
        placeholder="市场"
        value={detailFilters.market}
        onValueChange={v => setDetailFilter('market', v)}
        options={[
          { value: 'HK', label: 'HK' },
          { value: 'US', label: 'US' },
        ]}
      />

      <CompactSelect
        placeholder="方向"
        value={detailFilters.side}
        onValueChange={v => setDetailFilter('side', v)}
        options={[
          { value: '買入', label: '買入' },
          { value: '賣出', label: '賣出' },
        ]}
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetDetailFilters} className="h-7 text-xs gap-1 px-1.5">
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

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
