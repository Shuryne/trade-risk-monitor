import { NavLink } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { useRiskStore } from '@/stores/riskStore'
import {
  Upload,
  LayoutDashboard,
  TableProperties,
  Settings,
  History,
  FileText,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: '上传数据', icon: Upload, requiresData: false },
  { to: '/dashboard', label: '风险仪表盘', icon: LayoutDashboard, requiresData: true },
  { to: '/detail', label: '风险明细', icon: TableProperties, requiresData: true },
  { to: '/report', label: '风险报告', icon: FileText, requiresData: true },
  { to: '/settings', label: '规则配置', icon: Settings, requiresData: false },
  { to: '/history', label: '历史记录', icon: History, requiresData: false },
  { to: '/trends', label: '趋势分析', icon: TrendingUp, requiresData: false },
]

export function Sidebar() {
  const hasData = useOrderStore(s => s.hasData)
  const hasResults = useRiskStore(s => s.hasResults)
  const dataReady = hasData && hasResults

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <ShieldAlert className="h-6 w-6 text-primary" />
        <span className="text-sm font-semibold">交易风险监控</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map(item => {
          const disabled = item.requiresData && !dataReady
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={disabled ? '#' : item.to}
              onClick={e => disabled && e.preventDefault()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive && !disabled
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  disabled && 'pointer-events-none opacity-40'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">数据仅在本地处理</p>
      </div>
    </aside>
  )
}
