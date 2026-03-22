import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Order } from '@/types/order'
import type { RiskResult } from '@/types/risk'

interface MarketCompareChartProps {
  orders: Order[];
  results: RiskResult[];
}

export function MarketCompareChart({ orders, results }: MarketCompareChartProps) {
  const riskOrderIds = new Set(results.map(r => r.order.order_id))

  const stats = { HK: { total: 0, risk: 0 }, US: { total: 0, risk: 0 } }
  for (const order of orders) {
    const m = order.market
    if (m === 'HK' || m === 'US') {
      stats[m].total++
      if (riskOrderIds.has(order.order_id)) stats[m].risk++
    }
  }

  const data = [
    { market: 'HK (港股)', 全部订单: stats.HK.total, 风险订单: stats.HK.risk },
    { market: 'US (美股)', 全部订单: stats.US.total, 风险订单: stats.US.risk },
  ]

  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-sm">市场对比</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="market" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="全部订单" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="风险订单" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
