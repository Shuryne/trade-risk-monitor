import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Order } from '@/types/order'
import type { RiskResult } from '@/types/risk'
import { getHKTHour } from '@/utils/timezone'

interface TimelineChartProps {
  orders: Order[];
  results: RiskResult[];
}

export function TimelineChart({ orders, results }: TimelineChartProps) {
  const riskOrderIds = new Set(results.map(r => r.order.order_id))

  // 按小时分组
  const hourData: Record<number, { total: number; risk: number }> = {}
  for (let h = 0; h < 24; h++) {
    hourData[h] = { total: 0, risk: 0 }
  }

  for (const order of orders) {
    const hour = getHKTHour(order.order_time)
    hourData[hour].total++
    if (riskOrderIds.has(order.order_id)) {
      hourData[hour].risk++
    }
  }

  const data = Object.entries(hourData).map(([hour, counts]) => ({
    hour: `${hour}:00`,
    全部订单: counts.total,
    风险订单: counts.risk,
  }))

  return (
    <Card>
      <CardHeader className="py-3"><CardTitle className="text-sm">交易时间分布（HKT）</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="全部订单" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="风险订单" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
