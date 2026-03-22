import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { RiskLevelChart } from '@/components/dashboard/RiskLevelChart'
import { RiskTypeChart } from '@/components/dashboard/RiskTypeChart'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { TopAccountsTable } from '@/components/dashboard/TopAccountsTable'
import { MarketCompareChart } from '@/components/dashboard/MarketCompareChart'
import { useOrderStore } from '@/stores/orderStore'
import { useRiskStore } from '@/stores/riskStore'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { FileBarChart, AlertTriangle, ShieldAlert, Users, Globe } from 'lucide-react'

export default function DashboardPage() {
  const { orders, summary } = useOrderStore()
  const { results } = useRiskStore()

  const riskCount = results.length
  const highCount = results.filter(r => r.highest_severity === 'HIGH').length
  const riskAccountIds = new Set(results.map(r => r.order.account_id))

  const hkOrders = orders.filter(o => o.market === 'HK').length
  const usOrders = orders.filter(o => o.market === 'US').length

  return (
    <div className="flex flex-col h-full">
      <Header title="风险仪表盘" description="当日风险全景视图" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="当日订单总数"
            value={formatNumber(summary.totalRows)}
            icon={FileBarChart}
          />
          <StatCard
            label="风险订单"
            value={formatNumber(riskCount)}
            subValue={summary.totalRows > 0 ? `占比 ${formatPercent(riskCount / summary.totalRows)}` : undefined}
            icon={AlertTriangle}
            iconColor="text-orange-500"
          />
          <StatCard
            label="高风险订单"
            value={formatNumber(highCount)}
            icon={ShieldAlert}
            iconColor="text-red-500"
          />
          <StatCard
            label="风险账户"
            value={formatNumber(riskAccountIds.size)}
            icon={Users}
            iconColor="text-blue-500"
          />
          <StatCard
            label="市场分布"
            value={`HK ${hkOrders} / US ${usOrders}`}
            icon={Globe}
            iconColor="text-green-500"
          />
        </div>

        {/* 图表区域 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RiskLevelChart results={results} />
          <RiskTypeChart results={results} />
        </div>

        <TimelineChart orders={orders} results={results} />

        <div className="grid gap-6 lg:grid-cols-2">
          <TopAccountsTable results={results} />
          <MarketCompareChart orders={orders} results={results} />
        </div>
      </div>
    </div>
  )
}
