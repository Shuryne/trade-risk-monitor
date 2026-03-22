import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ label, value, subValue, icon: Icon, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 px-4 py-4">
        <div className={`rounded-lg bg-muted p-2.5 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
