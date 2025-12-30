/**
 * 製造月次サマリーカード
 * 総生産量、総個数、平均人員、生産性、有給休暇を表示
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/format'
import { Factory, Layers, Users, TrendingUp, Clock } from 'lucide-react'
import type { ManufacturingMonthlySummary } from '@/types/manufacturing'

interface Props {
  summary: ManufacturingMonthlySummary | null
  loading?: boolean
}

interface SummaryItem {
  label: string
  value: number | null
  unit: string
  icon: React.ReactNode
  format?: (v: number | null) => string
}

// 安全にtoFixedを呼び出す
function safeToFixed(v: number | null, decimals: number): string {
  if (v === null || v === undefined) return '-'
  const num = typeof v === 'number' ? v : Number(v)
  if (isNaN(num)) return '-'
  return num.toFixed(decimals)
}

export function ManufacturingSummaryCards({ summary, loading = false }: Props) {
  const items: SummaryItem[] = [
    {
      label: '総生産量',
      value: summary?.total_batts ?? null,
      unit: 'バット',
      icon: <Factory className="h-5 w-5 text-blue-600" />,
      format: (v) => formatNumber(v, ''),
    },
    {
      label: '総個数',
      value: summary?.total_pieces ?? null,
      unit: '個',
      icon: <Layers className="h-5 w-5 text-green-600" />,
      format: (v) => formatNumber(v, ''),
    },
    {
      label: '平均人員',
      value: summary?.total_workers ?? null,
      unit: '人',
      icon: <Users className="h-5 w-5 text-purple-600" />,
      format: (v) => safeToFixed(v, 1),
    },
    {
      label: '生産性',
      value: summary?.avg_production_per_worker ?? null,
      unit: 'バット/人',
      icon: <TrendingUp className="h-5 w-5 text-orange-600" />,
      format: (v) => safeToFixed(v, 2),
    },
    {
      label: '有給休暇',
      value: summary?.total_paid_leave_hours ?? null,
      unit: '時間',
      icon: <Clock className="h-5 w-5 text-teal-600" />,
      format: (v) => safeToFixed(v, 1),
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {item.icon}
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {item.format ? item.format(item.value) : (item.value ?? '-')}
              </span>
              <span className="text-sm text-gray-500">{item.unit}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
