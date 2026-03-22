import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { useRuleConfigStore } from '@/stores/ruleConfigStore'
import { useRiskStore } from '@/stores/riskStore'
import { useOrderStore } from '@/stores/orderStore'
import { RotateCcw, Play } from 'lucide-react'
import type { RuleConfig, RuleId } from '@/types/rule'

/** 定义每条规则有哪些可配置的参数 */
const PARAM_LABELS: Record<RuleId, Record<string, string>> = {
  R001: { threshold_hk: 'HK 市场阈值 (HKD)', threshold_us: 'US 市场阈值 (USD)' },
  R002: { time_window_minutes: '时间窗口（分钟）', order_count_threshold: '下单次数阈值' },
  R003: { concentration_threshold: '集中度阈值（0-1）' },
  R004: { concentration_threshold: '集中度阈值（0-1）' },
  R005: { deviation_threshold: '偏离阈值（0-1）' },
  R006: { time_window_minutes: '时间窗口（分钟）', quantity_deviation_threshold: '数量偏差阈值（0-1）', min_amount_hk: 'HK 最小金额 (HKD)', min_amount_us: 'US 最小金额 (USD)' },
  R007: { late_trading_hour: '起始小时 (HKT)', late_trading_minute: '起始分钟', threshold_hk: 'HK 金额阈值 (HKD)' },
  R008: { price_threshold: '股价阈值 (HKD)', amount_threshold_hk: 'HK 金额阈值 (HKD)' },
  R009: { cancel_rate_threshold: '撤单率阈值（0-1）', min_order_count: '最少订单数' },
  R010: { time_window_minutes: '时间窗口（分钟）', quantity_deviation_threshold: '数量偏差阈值（0-1）', min_amount_hk: 'HK 最小金额 (HKD)', min_amount_us: 'US 最小金额 (USD)' },
  R011: {},
}

export default function SettingsPage() {
  const { configs, updateConfig, resetToDefaults } = useRuleConfigStore()
  const { analyze } = useRiskStore()
  const { orders, hasData } = useOrderStore()
  const navigate = useNavigate()

  const handleReanalyze = useCallback(() => {
    if (hasData) {
      analyze(orders, configs)
      navigate('/dashboard')
    }
  }, [hasData, analyze, orders, configs, navigate])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="规则配置"
        description="自定义风险检测规则的阈值和开关"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-1" />
              恢复默认值
            </Button>
            {hasData && (
              <Button size="sm" onClick={handleReanalyze}>
                <Play className="h-4 w-4 mr-1" />
                重新分析
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {configs.map(config => (
          <RuleConfigCard key={config.rule_id} config={config} onUpdate={updateConfig} />
        ))}
      </div>
    </div>
  )
}

function RuleConfigCard({
  config,
  onUpdate,
}: {
  config: RuleConfig;
  onUpdate: (ruleId: string, updates: Partial<RuleConfig>) => void;
}) {
  const paramLabels = PARAM_LABELS[config.rule_id] ?? {}

  return (
    <Card className={!config.enabled ? 'opacity-60' : ''}>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">{config.rule_id}: {config.name}</CardTitle>
            <RiskBadge severity={config.severity} />
            {config.applicable_markets && (
              <span className="text-xs text-muted-foreground">
                仅 {config.applicable_markets.join('/')}
              </span>
            )}
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={checked => onUpdate(config.rule_id, { enabled: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </CardHeader>

      {Object.keys(paramLabels).length > 0 && config.enabled && (
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(paramLabels).map(([paramKey, label]) => (
              <div key={paramKey} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  value={config.params[paramKey] ?? ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value)
                    if (!isNaN(val) && val >= 0) {
                      onUpdate(config.rule_id, {
                        params: { ...config.params, [paramKey]: val },
                      })
                    }
                  }}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
