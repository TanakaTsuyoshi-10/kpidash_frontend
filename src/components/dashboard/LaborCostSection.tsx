/**
 * 経営指標 — 部署別 人件費・時間外（SmartHR連携）
 *
 * SmartHR連携による部署別の人件費（折れ線グラフ＋表）と
 * 時間外労働（グループ棒グラフ＋表）を表示する。
 * 認証情報未手配の間は「サンプル表示」バッジを出す。
 * 役員・管理者のみ閲覧可能なセクション。
 */
'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Users, Lock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLaborSummary } from '@/hooks/useHr'
import type {
  DepartmentLaborCost,
  DepartmentOvertime,
  LaborCostTrendPoint,
} from '@/types/hr'

// 部署 → 折れ線の色（design-demo に準拠）
const DEPARTMENT_COLORS: Record<string, string> = {
  店舗部門: '#16a34a',
  通販部門: '#0ea5e9',
  製造部門: '#f59e0b',
  本社: '#a855f7',
}

/** 前年比を「+8.5%」形式にフォーマットする */
function formatYoY(rate: number): string {
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

/**
 * 前年比の色クラスを返す。
 * 人件費・時間外いずれも増加=コスト/負担増のため赤、減少=緑。
 */
function yoyColorClass(rate: number): string {
  if (rate > 0) return 'text-red-500'
  if (rate < 0) return 'text-emerald-600'
  return 'text-gray-500'
}

// =============================================================================
// 人件費の折れ線グラフ
// =============================================================================

interface LaborCostChartProps {
  trend: LaborCostTrendPoint[]
}

function LaborCostChart({ trend }: LaborCostChartProps) {
  // Recharts 用にフラット化（{ month, 店舗部門, 通販部門, ... }）
  const data = trend.map((point) => ({
    month: point.month,
    ...point.values,
  }))

  const departments = trend.length > 0 ? Object.keys(trend[0].values) : []

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis
          tick={{ fontSize: 10 }}
          width={36}
          domain={['auto', 'auto']}
          label={{ value: '百万円', angle: -90, position: 'insideLeft', fontSize: 9 }}
        />
        <Tooltip
          formatter={(value) => `${value} 百万円`}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={10} />
        {departments.map((dept) => (
          <Line
            key={dept}
            type="monotone"
            dataKey={dept}
            stroke={DEPARTMENT_COLORS[dept] ?? '#6b7280'}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// =============================================================================
// 時間外労働のグループ棒グラフ
// =============================================================================

interface OvertimeChartProps {
  overtime: DepartmentOvertime[]
}

function OvertimeChart({ overtime }: OvertimeChartProps) {
  const data = overtime.map((item) => ({
    department: item.department,
    前年同月: item.previous_year,
    当月: item.current,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="department" tick={{ fontSize: 10 }} />
        <YAxis
          tick={{ fontSize: 10 }}
          width={36}
          label={{ value: '時間/月', angle: -90, position: 'insideLeft', fontSize: 9 }}
        />
        <Tooltip
          formatter={(value) => `${value} 時間`}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={10} />
        <Bar dataKey="前年同月" fill="#d1d5db" radius={[3, 3, 0, 0]} />
        <Bar dataKey="当月" fill="#f43f5e" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// =============================================================================
// 指標テーブル（人件費・時間外 共通）
// =============================================================================

interface MetricTableProps {
  rows: Array<DepartmentLaborCost | DepartmentOvertime>
  unitLabel: string
}

function MetricTable({ rows, unitLabel }: MetricTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-600">
            <th className="text-left p-1.5 border border-gray-200 font-medium">部署</th>
            <th className="p-1.5 border border-gray-200 font-medium">前年同月</th>
            <th className="p-1.5 border border-gray-200 font-medium">当月</th>
            <th className="p-1.5 border border-gray-200 font-medium">前年比</th>
          </tr>
        </thead>
        <tbody className="text-right">
          {rows.map((row) => (
            <tr key={row.department}>
              <td className="text-left p-1.5 border border-gray-100">
                {row.department}
              </td>
              <td className="p-1.5 border border-gray-100">
                {row.previous_year.toFixed(1)}
              </td>
              <td className="p-1.5 border border-gray-100 font-semibold">
                {row.current.toFixed(1)}
              </td>
              <td
                className={cn(
                  'p-1.5 border border-gray-100',
                  yoyColorClass(row.yoy_rate)
                )}
              >
                {formatYoY(row.yoy_rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-400 mt-1">{unitLabel}</p>
    </div>
  )
}

// =============================================================================
// メインセクション
// =============================================================================

export function LaborCostSection() {
  const { data, loading, error } = useLaborSummary()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-rose-50">
        <h2 className="font-semibold flex items-center gap-2 text-rose-800">
          <Users className="h-5 w-5" />
          経営指標 — 部署別 人件費・時間外
        </h2>
        <div className="flex items-center gap-2">
          {data?.is_sample && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              サンプル表示
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-rose-600">
            <Lock className="h-3 w-3" />
            役員・管理者のみ
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 補足説明（サンプル時のみ） */}
        {data?.is_sample && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            SmartHR API連携。認証情報の入手後に実データへ切り替わります（現在はサンプル）。
          </p>
        )}

        {/* ローディング */}
        {loading && (
          <div className="space-y-5">
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          </div>
        )}

        {/* エラー */}
        {!loading && error && (
          <div className="text-sm text-red-500 text-center py-8">
            データの取得に失敗しました: {error}
          </div>
        )}

        {/* データなし */}
        {!loading && !error && !data && (
          <div className="text-sm text-gray-400 text-center py-8">
            データがありません
          </div>
        )}

        {/* 本体 */}
        {!loading && !error && data && (
          <>
            {/* 人件費 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                部署別 人件費の推移
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-48">
                  <LaborCostChart trend={data.labor_cost_trend} />
                </div>
                <MetricTable
                  rows={data.labor_costs}
                  unitLabel="単位: 百万円／月"
                />
              </div>
            </div>

            {/* 時間外 */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                部署別 時間外労働
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-48">
                  <OvertimeChart overtime={data.overtime} />
                </div>
                <MetricTable
                  rows={data.overtime}
                  unitLabel="単位: 時間／月（1人あたり平均）"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
