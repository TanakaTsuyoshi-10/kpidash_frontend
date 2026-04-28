/**
 * データ鮮度バー
 * "店舗: 昨日 | 通販: 3月 | 財務: 2月" 色分け表示
 */
'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DataFreshnessData } from '@/types/dashboard'

interface Props {
  freshness: DataFreshnessData | null
  loading?: boolean
}

function getFreshnessLevel(dateStr: string | null, type: 'date' | 'month'): {
  label: string
  color: string
} {
  if (!dateStr) return { label: 'データなし', color: 'text-gray-400' }

  const today = new Date()

  if (type === 'date') {
    const d = new Date(dateStr)
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) return { label: '昨日', color: 'text-green-600' }
    if (diffDays <= 3) return { label: `${diffDays}日前`, color: 'text-green-600' }
    if (diffDays <= 7) return { label: `${diffDays}日前`, color: 'text-yellow-600' }
    return { label: `${diffDays}日前`, color: 'text-red-600' }
  }

  // month type: "YYYY-MM"
  const parts = dateStr.split('-')
  const dataDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
  const diffMonths =
    (today.getFullYear() - dataDate.getFullYear()) * 12 +
    (today.getMonth() - dataDate.getMonth())

  const monthLabel = `${parseInt(parts[1])}月`
  if (diffMonths <= 1) return { label: monthLabel, color: 'text-green-600' }
  if (diffMonths <= 2) return { label: monthLabel, color: 'text-yellow-600' }
  return { label: monthLabel, color: 'text-red-600' }
}

export function DataFreshnessBar({ freshness, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
    )
  }

  if (!freshness) return null

  const store = getFreshnessLevel(freshness.store_latest, 'date')
  const ec = getFreshnessLevel(freshness.ecommerce_latest, 'month')
  const fin = getFreshnessLevel(freshness.financial_latest, 'month')

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 bg-gray-50 rounded-lg text-sm">
      <Clock className="h-4 w-4 text-gray-400" />
      <div className="flex items-center gap-1">
        <span className="text-gray-500">店舗:</span>
        <span className={cn('font-medium', store.color)}>{store.label}</span>
      </div>
      <span className="text-gray-300">|</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">通販:</span>
        <span className={cn('font-medium', ec.color)}>{ec.label}</span>
      </div>
      <span className="text-gray-300">|</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">財務:</span>
        <span className={cn('font-medium', fin.color)}>{fin.label}</span>
      </div>
    </div>
  )
}
