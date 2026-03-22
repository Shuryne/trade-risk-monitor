import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/uiStore'
import { useRiskStore } from '@/stores/riskStore'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { DEFAULT_RULE_CONFIGS } from '@/utils/constants'

export function FilterBar() {
  const { detailFilters, setDetailFilter, resetDetailFilters } = useUiStore()
  const { results } = useRiskStore()

  // 动态收集可选值
  const options = useMemo(() => {
    const accounts = new Set<string>()
    const symbols = new Set<string>()
    for (const r of results) {
      accounts.add(r.order.account_id)
      symbols.add(r.order.symbol)
    }
    return {
      accounts: [...accounts].sort(),
      symbols: [...symbols].sort(),
    }
  }, [results])

  const hasFilters = Object.values(detailFilters).some(v => v !== null && v !== '')

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 搜索框 */}
      <Input
        placeholder="搜索订单号、账户、标的、经纪人号..."
        value={detailFilters.search}
        onChange={e => setDetailFilter('search', e.target.value)}
        className="w-64"
      />

      {/* 风险等级 */}
      <FilterSelect
        placeholder="风险等级"
        value={detailFilters.severity}
        onValueChange={v => setDetailFilter('severity', v)}
        options={[
          { value: 'HIGH', label: '高风险' },
          { value: 'MEDIUM', label: '中风险' },
          { value: 'LOW', label: '低风险' },
        ]}
      />

      {/* 规则类型 */}
      <FilterSelect
        placeholder="风险规则"
        value={detailFilters.ruleId}
        onValueChange={v => setDetailFilter('ruleId', v)}
        options={DEFAULT_RULE_CONFIGS.map(r => ({ value: r.rule_id, label: `${r.rule_id} ${r.name}` }))}
      />

      {/* 市场 */}
      <FilterSelect
        placeholder="市场"
        value={detailFilters.market}
        onValueChange={v => setDetailFilter('market', v)}
        options={[
          { value: 'HK', label: 'HK 港股' },
          { value: 'US', label: 'US 美股' },
        ]}
      />

      {/* 交易方向 */}
      <FilterSelect
        placeholder="方向"
        value={detailFilters.side}
        onValueChange={v => setDetailFilter('side', v)}
        options={[
          { value: '買入', label: '買入' },
          { value: '賣出', label: '賣出' },
        ]}
      />

      {/* 账户 */}
      {options.accounts.length <= 50 && (
        <FilterSelect
          placeholder="账户"
          value={detailFilters.account}
          onValueChange={v => setDetailFilter('account', v)}
          options={options.accounts.map(a => ({ value: a, label: a }))}
        />
      )}

      {/* 清除筛选 */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetDetailFilters} className="gap-1">
          <X className="h-3 w-3" />
          清除
        </Button>
      )}
    </div>
  )
}

function FilterSelect({
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
      onValueChange={v => onValueChange(v === '__all__' ? null : v)}
    >
      <SelectTrigger className="w-auto min-w-[100px] h-9 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">全部</SelectItem>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
