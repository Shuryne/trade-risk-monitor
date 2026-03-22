import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import type { Order } from '@/types/order'
import type { RiskResult } from '@/types/risk'
import type { RuleConfig } from '@/types/rule'
import type { DataSummary } from '@/types/order'
import { formatDateTime, formatAmount, severityLabel } from '@/utils/formatters'

interface ReportData {
  orders: Order[];
  results: RiskResult[];
  ruleConfigs: RuleConfig[];
  summary: DataSummary;
}

/**
 * 生成 PDF 报告。
 *
 * 注意: jsPDF 默认不支持中文字符。当前使用 ASCII 安全的方式输出。
 * 生产环境需嵌入 Noto Sans SC 子集字体以正确显示中文。
 */
export function generatePdfReport(data: ReportData): void {
  const doc = new jsPDF({ orientation: 'landscape' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // 封面
  doc.setFontSize(22)
  doc.text('Trade Risk Monitoring Report', pageWidth / 2, 40, { align: 'center' })
  doc.setFontSize(12)
  doc.text(`Report Date: ${data.summary.timeRange?.start?.slice(0, 10) ?? 'N/A'}`, pageWidth / 2, 55, { align: 'center' })
  doc.text(`Generated: ${new Date().toISOString().slice(0, 19)}`, pageWidth / 2, 65, { align: 'center' })
  doc.text(`Total Orders: ${data.summary.totalRows}  |  Risk Orders: ${data.results.length}`, pageWidth / 2, 80, { align: 'center' })

  // 数据概览
  doc.addPage()
  doc.setFontSize(16)
  doc.text('Data Overview', 14, 20)

  const highCount = data.results.filter(r => r.highest_severity === 'HIGH').length
  const medCount = data.results.filter(r => r.highest_severity === 'MEDIUM').length
  const lowCount = data.results.filter(r => r.highest_severity === 'LOW').length

  autoTable(doc, {
    startY: 30,
    head: [['Metric', 'Value']],
    body: [
      ['Total Orders', String(data.summary.totalRows)],
      ['Risk Orders', String(data.results.length)],
      ['High Risk', String(highCount)],
      ['Medium Risk', String(medCount)],
      ['Low Risk', String(lowCount)],
      ['Accounts', String(data.summary.accountCount)],
      ['Symbols', String(data.summary.symbolCount)],
      ['Markets', data.summary.markets.join(', ')],
    ],
  })

  // 风险订单明细
  doc.addPage()
  doc.setFontSize(16)
  doc.text('Risk Order Details', 14, 20)

  autoTable(doc, {
    startY: 30,
    head: [['Severity', 'Time (HKT)', 'Account', 'Symbol', 'Side', 'Amount', 'Market', 'Rules']],
    body: data.results.map(r => [
      severityLabel(r.highest_severity),
      formatDateTime(r.order.order_time),
      r.order.account_id,
      r.order.symbol,
      r.order.side,
      formatAmount(r.order.order_amount, r.order.currency),
      r.order.market,
      r.flags.map(f => f.rule_id).join(', '),
    ]),
    styles: { fontSize: 7 },
    headStyles: { fontSize: 8 },
  })

  // 附录：规则配置
  doc.addPage()
  doc.setFontSize(16)
  doc.text('Appendix: Rule Configuration', 14, 20)

  autoTable(doc, {
    startY: 30,
    head: [['Rule ID', 'Name', 'Severity', 'Enabled', 'Parameters']],
    body: data.ruleConfigs.map(c => [
      c.rule_id,
      c.name,
      c.severity,
      c.enabled ? 'Yes' : 'No',
      Object.entries(c.params).map(([k, v]) => `${k}=${v}`).join('; '),
    ]),
    styles: { fontSize: 8 },
  })

  doc.save(`risk-report-${data.summary.timeRange?.start?.slice(0, 10) ?? 'unknown'}.pdf`)
}

/**
 * 导出风险结果为 CSV 文件。
 */
export function exportRiskCsv(results: RiskResult[]): void {
  const rows = results.map(r => ({
    risk_severity: r.highest_severity,
    review_status: r.review_status,
    order_id: r.order.order_id,
    order_time: formatDateTime(r.order.order_time),
    account_id: r.order.account_id,
    symbol: r.order.symbol,
    side: r.order.side,
    order_price: r.order.order_price,
    order_quantity: r.order.order_quantity,
    order_amount: r.order.order_amount,
    currency: r.order.currency,
    market: r.order.market,
    order_status: r.order.order_status,
    triggered_rules: r.flags.map(f => f.rule_id).join('; '),
    rule_descriptions: r.flags.map(f => f.description).join(' | '),
  }))

  const csv = Papa.unparse(rows)
  downloadFile(csv, 'risk-orders.csv', 'text/csv;charset=utf-8;')
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
