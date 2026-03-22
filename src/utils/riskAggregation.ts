import type { RiskResult } from '@/types/risk'

export interface SeverityCounts {
  high: number
  medium: number
  low: number
  total: number
}

export function countBySeverity(results: RiskResult[]): SeverityCounts {
  let high = 0, medium = 0, low = 0
  for (const r of results) {
    switch (r.highest_severity) {
      case 'HIGH': high++; break
      case 'MEDIUM': medium++; break
      case 'LOW': low++; break
    }
  }
  return { high, medium, low, total: results.length }
}
