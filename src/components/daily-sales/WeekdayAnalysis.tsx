/**
 * 曜日別分析（平日 / 土日祝）
 * 平均売上・バット数・来客数・客単価と対前年同月比を2カード＋比較表で表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Sun, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useWeekdayAnalysis } from '@/hooks/useDailySales'
import { cn } from '@/lib/utils'
import type { WeekdayGroupStats } from '@/types/daily-sales'

interface Props {
  month: string
  departmentSlug?: string
  /** 指定時はその店舗のみで集計（店舗詳細ページ用） */
  segmentId?: string
  /** cumulative で年度累計（9月〜対象月） */
  periodType?: 'monthly' | 'cumulative'
}

interface MetricDef {
  key: 'avg_sales' | 'avg_bats' | 'avg_customers' | 'avg_price'
  label: string
  format: (v: number) => string
}

const METRICS: MetricDef[] = [
  {
    key: 'avg_sales',
    label: '平均売上',
    format: (v) => `¥${Math.round(v).toLocaleString()}`,
  },
  {
    key: 'avg_bats',
    label: '平均バット数',
    format: (v) => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}バット`,
  },
  {
    key: 'avg_customers',
    label: '平均来客数',
    format: (v) => `${Math.round(v).toLocaleString()}人`,
  },
  {
    key: 'avg_price',
    label: '客単価',
    format: (v) => `¥${Math.round(v).toLocaleString()}`,
  },
]

function YoyBadge({ yoy }: { yoy: number | null }) {
  if (yoy == null) {
    return <span className="text-xs text-gray-400">前年データなし</span>
  }
  const diff = yoy - 100
  const Icon = diff > 0.05 ? TrendingUp : diff < -0.05 ? TrendingDown : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded',
        diff > 0.05
          ? 'bg-green-100 text-green-700'
          : diff < -0.05
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600',
      )}
    >
      <Icon className="h-3 w-3" />
      前年比 {yoy.toFixed(1)}%
    </span>
  )
}

function GroupCard({
  title,
  icon,
  stats,
  accent,
}: {
  title: string
  icon: React.ReactNode
  stats: WeekdayGroupStats
  accent: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className={cn('p-1.5 rounded-md', accent)}>{icon}</span>
          {title}
          <span className="ml-auto text-xs font-normal text-gray-400">
            集計 {stats.days}日（前年 {stats.prev.days}日）
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((m) => (
            <div key={m.key} className="rounded-lg border p-3">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="mt-1 text-xl font-bold text-gray-900 tabular-nums">
                {m.format(stats[m.key])}
              </p>
              <p className="mt-0.5 text-xs text-gray-400 tabular-nums">
                前年 {m.format(stats.prev[m.key])}
              </p>
              <div className="mt-1.5">
                <YoyBadge yoy={stats.yoy[m.key]} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function WeekdayAnalysis({ month, departmentSlug = 'store', segmentId, periodType = 'monthly' }: Props) {
  const { data, loading, error } = useWeekdayAnalysis(month, departmentSlug, segmentId, periodType)

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-48 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!data) {
    return <p className="text-sm text-gray-400">データがありません。</p>
  }

  return (
    <div className="space-y-4">
      <GroupCard
        title="平日（月〜金・祝日除く）"
        icon={<Briefcase className="h-4 w-4 text-blue-700" />}
        stats={data.weekday}
        accent="bg-blue-100"
      />
      <GroupCard
        title="土日祝"
        icon={<Sun className="h-4 w-4 text-orange-600" />}
        stats={data.weekend}
        accent="bg-orange-100"
      />

      {/* 平日 vs 土日祝 比較表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">平日 / 土日祝 比較</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium">指標</th>
                  <th className="px-3 py-2 text-right font-medium">平日</th>
                  <th className="px-3 py-2 text-right font-medium">土日祝</th>
                  <th className="px-3 py-2 text-right font-medium">土日祝/平日</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  const wd = data.weekday[m.key]
                  const we = data.weekend[m.key]
                  const ratio = wd > 0 ? (we / wd) * 100 : null
                  return (
                    <tr key={m.key} className="border-b">
                      <td className="px-3 py-2">{m.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{m.format(wd)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{m.format(we)}</td>
                      <td
                        className={cn(
                          'px-3 py-2 text-right tabular-nums font-medium',
                          ratio != null && ratio >= 100 ? 'text-green-600' : 'text-gray-600',
                        )}
                      >
                        {ratio != null ? `${ratio.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            ※ 土日祝には日本の祝日（振替休日含む）を含みます。平均はデータのある営業日のみで算出。
            バット数はぎょうざ系商品の販売個数から換算（1バット=60個・全店合計）。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
