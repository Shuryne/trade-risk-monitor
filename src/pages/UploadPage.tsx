import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { useRiskStore } from '@/stores/riskStore'
import { useRuleConfigStore } from '@/stores/ruleConfigStore'
import { storageService } from '@/services/storageService'
import { Header } from '@/components/layout/Header'
import { FileDropzone } from '@/components/upload/FileDropzone'
import { DataPreview } from '@/components/upload/DataPreview'
import { ValidationReport } from '@/components/upload/ValidationReport'
import { Button } from '@/components/ui/button'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import type { AnalysisSession } from '@/types/risk'

export default function UploadPage() {
  const navigate = useNavigate()
  const { orders, parseErrors, summary, isLoading, hasData, loadFile, clear } = useOrderStore()
  const { analyze } = useRiskStore()
  const { configs } = useRuleConfigStore()

  const handleFile = useCallback(
    (file: File) => {
      loadFile(file)
    },
    [loadFile]
  )

  const handleAnalyze = useCallback(() => {
    analyze(orders, configs)

    // 自动持久化到 IndexedDB
    const results = useRiskStore.getState().results
    const session: AnalysisSession = {
      id: crypto.randomUUID(),
      date: summary.timeRange?.start?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      total_orders: orders.length,
      risk_orders: results.length,
      high_risk_count: results.filter(r => r.highest_severity === 'HIGH').length,
      medium_risk_count: results.filter(r => r.highest_severity === 'MEDIUM').length,
      low_risk_count: results.filter(r => r.highest_severity === 'LOW').length,
      market_breakdown: {
        HK: {
          total: orders.filter(o => o.market === 'HK').length,
          risk: results.filter(r => r.order.market === 'HK').length,
        },
        US: {
          total: orders.filter(o => o.market === 'US').length,
          risk: results.filter(r => r.order.market === 'US').length,
        },
      },
      orders,
      risk_results: results,
      rule_config: configs,
      notes: useRiskStore.getState().notes,
      reviewTimestamps: useRiskStore.getState().reviewTimestamps,
      firstReviewAt: useRiskStore.getState().firstReviewAt,
      lastReviewAt: useRiskStore.getState().lastReviewAt,
    }
    storageService.saveSession(session)

    navigate('/dashboard')
  }, [analyze, orders, configs, summary, navigate])

  const handleReset = useCallback(() => {
    clear()
    useRiskStore.getState().clear()
  }, [clear])

  return (
    <div className="flex flex-col h-full">
      <Header
        title="上传交易数据"
        description="上传当日交易订单 CSV 文件，系统将自动解析并进行风险分析"
        actions={
          hasData ? (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              重新上传
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* 上传区域 */}
        {!hasData && (
          <FileDropzone onFile={handleFile} isLoading={isLoading} />
        )}

        {/* 校验错误 */}
        <ValidationReport errors={parseErrors} />

        {/* 数据预览 + 分析按钮 */}
        {hasData && (
          <>
            <DataPreview orders={orders} summary={summary} />

            <div className="flex justify-center">
              <Button size="lg" onClick={handleAnalyze} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                开始风险分析
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
