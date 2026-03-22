import { Header } from '@/components/layout/Header'
import { FilterBar } from '@/components/detail/FilterBar'
import { RiskOrderTable } from '@/components/detail/RiskOrderTable'

export default function DetailPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="风险订单明细" description="可筛选、排序的风险订单详细列表" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <FilterBar />
        <RiskOrderTable />
      </div>
    </div>
  )
}
