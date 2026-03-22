import { NavLink, useLocation } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { useRiskStore } from '@/stores/riskStore'
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar'
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
  const location = useLocation()

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-semibold truncate group-data-[collapsible=icon]:hidden">
            交易风险监控
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map(item => {
              const disabled = item.requiresData && !dataReady
              const Icon = item.icon
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)

              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={isActive && !disabled}
                    className={cn(disabled && 'pointer-events-none opacity-40')}
                    render={
                      <NavLink
                        to={disabled ? '#' : item.to}
                        onClick={e => disabled && e.preventDefault()}
                      />
                    }
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          数据仅在本地处理
        </p>
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  )
}
