/**
 * EC Web分析カード（GA4連携）
 *
 * design-demo/dashboard-demo.html の「EC Web分析」カードに準拠。
 * 簡易コメントのバナー、前日流入数・離脱率の2タイル、流入経路ドーナツ、地区別の横棒リスト。
 */
'use client'

import { useMemo } from 'react'
import { Activity, Globe, MessageCircle } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useGa4EcSummary } from '@/hooks/useGa4'
import { cn } from '@/lib/utils'
import type { MetricComparison } from '@/types/ga4'

// ドーナツの配色（indigo系グラデーション）
const CHANNEL_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

/**
 * 変化率/pt差をラベル文字列にする
 */
function formatDelta(value: number, isPoint: boolean): string {
  const sign = value > 0 ? '+' : ''
  const unit = isPoint ? 'pt' : '%'
  return `${sign}${value.toFixed(1)}${unit}`
}

/**
 * 改善（緑）か悪化（赤）かを判定して色クラスを返す。
 * lowerIsBetter が true の指標（離脱率）は減少が改善。
 */
function deltaColor(value: number, lowerIsBetter: boolean): string {
  const improved = lowerIsBetter ? value < 0 : value > 0
  if (value === 0) return 'text-gray-500'
  return improved ? 'text-emerald-600' : 'text-red-500'
}

interface MetricTileProps {
  label: string
  metric: MetricComparison
  unit: string
  /** 表示桁（流入数=整数 / 離脱率=小数1桁） */
  decimals: number
  /** 比較値がpt差か（離脱率） */
  isPoint: boolean
  /** 値が小さいほど良い指標か（離脱率） */
  lowerIsBetter: boolean
}

function MetricTile({
  label,
  metric,
  unit,
  decimals,
  isPoint,
  lowerIsBetter,
}: MetricTileProps) {
  const displayValue =
    decimals > 0
      ? metric.value.toFixed(decimals)
      : Math.round(metric.value).toLocaleString('ja-JP')

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-0.5">
        {displayValue}
        <span className="text-xs font-medium text-gray-500"> {unit}</span>
      </p>
      <div className="flex gap-3 mt-1 text-[11px]">
        <span className={cn(deltaColor(metric.vs_prev_month, lowerIsBetter))}>
          前月比 {formatDelta(metric.vs_prev_month, isPoint)}
        </span>
        <span className={cn(deltaColor(metric.vs_prev_year, lowerIsBetter))}>
          前年比 {formatDelta(metric.vs_prev_year, isPoint)}
        </span>
      </div>
    </div>
  )
}

export function EcWebAnalyticsCard() {
  const { data, loading, error } = useGa4EcSummary()

  const channelData = useMemo(
    () =>
      (data?.channels ?? []).map((c) => ({
        name: c.channel,
        value: c.share,
      })),
    [data]
  )

  const maxRegionSessions = useMemo(() => {
    if (!data?.regions?.length) return 0
    return Math.max(...data.regions.map((r) => r.sessions))
  }, [data])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-indigo-50">
        <h2 className="font-semibold flex items-center gap-2 text-indigo-800">
          <Globe className="h-5 w-5" />
          EC Web分析
        </h2>
        <span className="flex items-center gap-1 text-[11px] text-indigo-600">
          <Activity className="h-3.5 w-3.5" />
          Googleアナリティクス連携
        </span>
      </div>

      <div className="p-5 space-y-4">
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-gray-100 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-gray-100 rounded-lg" />
              <div className="h-20 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-40 bg-gray-100 rounded-lg" />
          </div>
        )}

        {!loading && error && (
          <p className="text-xs text-gray-400 py-6 text-center">
            EC Web分析データを取得できませんでした
          </p>
        )}

        {!loading && !error && data && (
          <>
            {/* 簡易コメント */}
            <div className="flex items-start gap-2 bg-indigo-50/60 rounded-lg p-3">
              <MessageCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">
                {data.comment}
              </p>
            </div>

            {/* 主要指標タイル */}
            <div className="grid grid-cols-2 gap-3">
              <MetricTile
                label={`前日の流入数（${data.date_label}）`}
                metric={data.sessions}
                unit="セッション"
                decimals={0}
                isPoint={false}
                lowerIsBetter={false}
              />
              <MetricTile
                label="離脱率"
                metric={data.bounce_rate}
                unit="%"
                decimals={1}
                isPoint
                lowerIsBetter
              />
            </div>

            {/* 流入経路 & 地区別 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 流入経路ドーナツ */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  流入経路
                </p>
                <div className="h-40">
                  {channelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={58}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {channelData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            `${Number(value).toFixed(1)}%`,
                            String(name),
                          ]}
                          contentStyle={{
                            fontSize: '11px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-gray-400 flex items-center justify-center h-full">
                      データなし
                    </p>
                  )}
                </div>
                {/* 凡例 */}
                <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {channelData.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-1 text-[10px] text-gray-600"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CHANNEL_COLORS[index % CHANNEL_COLORS.length],
                        }}
                      />
                      <span className="truncate">{entry.name}</span>
                      <span className="text-gray-400 ml-auto">
                        {entry.value.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 地区別流入の横棒リスト */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  地区別 流入（訪問者の地域・前日）
                </p>
                <div className="space-y-1.5 text-xs">
                  {data.regions.map((region) => {
                    const width =
                      maxRegionSessions > 0
                        ? Math.round((region.sessions / maxRegionSessions) * 100)
                        : 0
                    return (
                      <div key={region.region}>
                        <div className="flex justify-between mb-0.5">
                          <span>{region.region}</span>
                          <span className="text-gray-500">
                            {region.sessions.toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-2 bg-indigo-500 rounded-full"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {data.regions.length === 0 && (
                    <p className="text-gray-400">データなし</p>
                  )}
                </div>
              </div>
            </div>

            {data.is_sample && (
              <p className="text-[10px] text-amber-600">
                ※ サンプル表示。GA4認証情報の設定後に実データへ切り替わります。
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
