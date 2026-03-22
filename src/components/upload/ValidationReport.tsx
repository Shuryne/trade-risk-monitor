import type { ParseError } from '@/types/order'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface ValidationReportProps {
  errors: ParseError[];
}

export function ValidationReport({ errors }: ValidationReportProps) {
  if (errors.length === 0) return null

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>数据校验发现 {errors.length} 个问题</AlertTitle>
      <AlertDescription>
        <div className="mt-2 max-h-60 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="py-1 text-left">行号</th>
                <th className="py-1 text-left">列</th>
                <th className="py-1 text-left">问题描述</th>
              </tr>
            </thead>
            <tbody>
              {errors.slice(0, 50).map((err, i) => (
                <tr key={i} className="border-b border-destructive/20">
                  <td className="py-1 font-mono">{err.row}</td>
                  <td className="py-1">{err.column || '-'}</td>
                  <td className="py-1">{err.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors.length > 50 && (
            <p className="mt-2 text-xs">...还有 {errors.length - 50} 个问题未显示</p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
