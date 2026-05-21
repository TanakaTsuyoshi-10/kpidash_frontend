/**
 * 部門別 売上実績セクション（全幅）
 *
 * design-demo/dashboard-demo.html の「部門別 売上実績（前月）」セクションに準拠。
 * 店舗5地区（福岡・熊本・宮崎・都城・鹿児島）＋通販5チャネル（EC・電話・FAX・店舗受付・ふるさと納税）
 * 計10項目を、前々年同月／前年同月／今年度直近月の3期間でグループ棒グラフと表の両方で表示する。
 * 棒グラフ上には前年同月比の増減矢印（▲緑 / ▼赤 / —灰）を表示する。
 * 単位は百万円。
 */
'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRegionalSummary } from '@/hooks/useRegional'
import { useChannelSummary } from '@/hooks/useEcommerce'
import {
  formatPeriod,
  getCalendarYear,
  getCurrentFiscalYear,
  getPreviousMonth,
} from '@/lib/fiscal-year'

// 店舗部門の対象5地区（この順・この名称のみ表示。「その他」は除外）
const TARGET_REGIONS = ['福岡', '熊本', '宮崎', '都城', '鹿児島'] as const

// 通販部門の対象5チャネル
const TARGET_CHANNELS = ['EC', '電話', 'FAX', '店舗受付', 'ふるさと納税'] as const

// 棒グラフ・凡例の配色（design-demo に準拠）
const COLOR_TWO_YEARS = '#d1d5db' // 前々年同月（グレー）
const COLOR_PREV_YEAR = '#6ee7b7' // 前年同月（薄緑）
const COLOR_CURRENT = '#16a34a' // 今年度直近月（緑）

// 円 → 百万円換算
const YEN_TO_MILLION = 1_000_000

type ArrowDir = 'up' | 'down' | 'flat'

interface DeptRow {
  /** 項目名（地区名 or チャネル名） */
  name: string
  /** 前々年同月（百万円 or null） */
  twoYearsAgo: number | null
  /** 前年同月（百万円 or null） */
  previousYear: number | null
  /** 今年度直近月（百万円 or null） */
  current: number | null
  /** 前年同月比（%。算出不能時 null） */
  yoyRate: number | null
}

/** 円を百万円に換算（null/未定義は null） */
function toMillion(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  return value / YEN_TO_MILLION
}

/** 前年同月比（%）を算出。算出不能時は null */
function calcYoY(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null
  return ((current - previous) / previous) * 100
}

/** 前年比から増減方向を判定（±1%未満は横ばい扱い） */
function arrowDir(yoyRate: number | null): ArrowDir {
  if (yoyRate === null) return 'flat'
  if (yoyRate > 1) return 'up'
  if (yoyRate < -1) return 'down'
  return 'flat'
}

/** 百万円の表示文字列（小数1桁。null は「—」） */
function fmtMillion(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(1)
}

/** 前年比の表示文字列（▲+8.9% / ▼-3.7% / —0.0%） */
function fmtYoY(yoyRate: number | null): { text: string; className: string } {
  if (yoyRate === null) return { text: '—', className: 'text-gray-400' }
  const dir = arrowDir(yoyRate)
  const symbol = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—'
  const sign = yoyRate > 0 ? '+' : ''
  const className =
    dir === 'up'
      ? 'text-emerald-600'
      : dir === 'down'
        ? 'text-red-500'
        : 'text-gray-400'
  return { text: `${symbol}${sign}${yoyRate.toFixed(1)}%`, className }
}

// =============================================================================
// 増減矢印（「今年度直近月」バー上のラベル）
// =============================================================================

interface ArrowLabelProps {
  rows: DeptRow[]
  // Recharts が <LabelList> の content に各バーごとに注入する props
  x?: number
  y?: number
  width?: number
  index?: number
}

/**
 * 「今年度直近月」バーの上に前年同月比の増減矢印（▲緑 / ▼赤 / —灰）を描画する。
 * Recharts の <LabelList content=...> から各バーの座標を受け取る。
 */
function ArrowLabel({ rows, x, y, width, index }: ArrowLabelProps) {
  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    index === undefined
  ) {
    return null
  }
  const row = rows[index]
  if (!row) return null
  const dir = arrowDir(row.yoyRate)
  const symbol = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—'
  const color = dir === 'up' ? '#16a34a' : dir === 'down' ? '#ef4444' : '#9ca3af'
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fontSize={13}
      fontWeight={700}
      fill={color}
    >
      {symbol}
    </text>
  )
}

// =============================================================================
// メインセクション
// =============================================================================

export function DepartmentSalesSection() {
  // 最新確定月＝前月（速報確定月）。会計年度と組み合わせて期間文字列を生成。
  const { period, calendarYear, displayMonth } = useMemo(() => {
    const fiscalYear = getCurrentFiscalYear()
    const month = getPreviousMonth()
    return {
      period: formatPeriod(fiscalYear, month),
      calendarYear: getCalendarYear(fiscalYear, month),
      displayMonth: month,
    }
  }, [])

  const { data: regionalData, loading: regionalLoading } = useRegionalSummary(
    period,
    'monthly'
  )
  const { data: channelData, loading: channelLoading } = useChannelSummary(
    period,
    'monthly'
  )

  const loading = regionalLoading || channelLoading

  // 店舗5地区の行データ（指定順・指定5地区のみ）
  const storeRows: DeptRow[] = useMemo(() => {
    const regions = regionalData?.regions ?? []
    return TARGET_REGIONS.map((name) => {
      // DBの地区名は「福岡地区」等の接尾辞付き。短縮名で前方一致させる
      const region =
        regions.find((r) => r.region_name === name) ??
        regions.find((r) => r.region_name.startsWith(name))
      const twoYearsAgo = toMillion(region?.total_sales_two_years_ago)
      const previousYear = toMillion(region?.total_sales_previous_year)
      const current = toMillion(region?.total_sales)
      return {
        name,
        twoYearsAgo,
        previousYear,
        current,
        yoyRate: calcYoY(current, previousYear),
      }
    })
  }, [regionalData])

  // 通販5チャネルの行データ（指定順・指定5チャネルのみ）
  const channelRows: DeptRow[] = useMemo(() => {
    const channelMap = new Map(
      (channelData?.channels ?? []).map((c) => [c.channel, c])
    )
    return TARGET_CHANNELS.map((name) => {
      const channel = channelMap.get(name)
      const twoYearsAgo = toMillion(channel?.sales_two_years_ago)
      const previousYear = toMillion(channel?.sales_previous_year)
      const current = toMillion(channel?.sales)
      return {
        name,
        twoYearsAgo,
        previousYear,
        current,
        yoyRate: calcYoY(current, previousYear),
      }
    })
  }, [channelData])

  const allRows = useMemo(
    () => [...storeRows, ...channelRows],
    [storeRows, channelRows]
  )

  // Recharts 用データ（null は 0 として描画。表側で「—」を出すので欠損は欠損として保持）
  const chartData = useMemo(
    () =>
      allRows.map((row) => ({
        name: row.name,
        twoYearsAgo: row.twoYearsAgo ?? 0,
        previousYear: row.previousYear ?? 0,
        current: row.current ?? 0,
      })),
    [allRows]
  )

  // 期間ラベル（前々年・前年・今年）
  const labelTwoYears = `前々年同月 ${calendarYear - 2}年${displayMonth}月`
  const labelPrevYear = `前年同月 ${calendarYear - 1}年${displayMonth}月`
  const labelCurrent = `今年度直近月 ${calendarYear}年${displayMonth}月`
  const shortTwoYears = `前々年同月 '${String(calendarYear - 2).slice(2)}/${displayMonth}`
  const shortPrevYear = `前年同月 '${String(calendarYear - 1).slice(2)}/${displayMonth}`
  const shortCurrent = `今年度直近月 '${String(calendarYear).slice(2)}/${displayMonth}`

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* 見出し */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
        <h2 className="font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          部門別 売上実績（前月）
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_TWO_YEARS }}
            />
            {labelTwoYears}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_PREV_YEAR }}
            />
            {labelPrevYear}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_CURRENT }}
            />
            {labelCurrent}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        店舗部門5地区＋通販部門5チャネル＝計10項目を3期間で比較／単位: 百万円／棒グラフ上の ▲▼ は前年同月比の増減
      </p>

      {loading ? (
        <div className="space-y-4">
          <div className="h-72 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      ) : (
        <>
          {/* グループ棒グラフ（増減矢印つき） */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex text-[11px] font-semibold mb-1.5 gap-1">
              <span className="flex-1 text-center text-emerald-700 bg-emerald-50 rounded py-1">
                店舗部門（地区別）— 5地区
              </span>
              <span className="flex-1 text-center text-sky-700 bg-sky-50 rounded py-1">
                通販部門（チャネル別）— 5チャネル
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 24, right: 8, bottom: 0, left: -12 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={44}
                    label={{
                      value: '百万円',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(1)} 百万円`}
                    contentStyle={{
                      fontSize: '11px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconSize={10}
                    verticalAlign="bottom"
                  />
                  <Bar
                    dataKey="twoYearsAgo"
                    name={shortTwoYears}
                    fill={COLOR_TWO_YEARS}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="previousYear"
                    name={shortPrevYear}
                    fill={COLOR_PREV_YEAR}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="current"
                    name={shortCurrent}
                    fill={COLOR_CURRENT}
                    radius={[3, 3, 0, 0]}
                  >
                    <LabelList
                      dataKey="current"
                      content={<ArrowLabel rows={allRows} />}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-1 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="text-green-600 font-bold">▲</span>前年比 増加
              </span>
              <span className="flex items-center gap-1">
                <span className="text-red-500 font-bold">▼</span>前年比 減少
              </span>
              <span className="flex items-center gap-1">
                <span className="text-gray-400 font-bold">—</span>横ばい
              </span>
            </div>
          </div>

          {/* 表形式 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[680px]">
                <thead>
                  <tr>
                    <th className="text-left p-1.5" />
                    <th
                      colSpan={5}
                      className="p-1.5 text-emerald-700 bg-emerald-50 border border-gray-200 font-semibold"
                    >
                      店舗部門（地区別）
                    </th>
                    <th
                      colSpan={5}
                      className="p-1.5 text-sky-700 bg-sky-50 border border-gray-200 font-semibold"
                    >
                      通販部門（チャネル別）
                    </th>
                  </tr>
                  <tr className="text-gray-600 bg-gray-50">
                    <th className="text-left p-1.5 font-medium">期間</th>
                    {allRows.map((row) => (
                      <th
                        key={row.name}
                        className="p-1.5 border border-gray-200 font-medium"
                      >
                        {row.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-right text-gray-700">
                  <tr>
                    <td className="text-left p-1.5 font-medium text-gray-500 whitespace-nowrap">
                      {shortTwoYears}
                    </td>
                    {allRows.map((row) => (
                      <td
                        key={row.name}
                        className="p-1.5 border border-gray-100"
                      >
                        {fmtMillion(row.twoYearsAgo)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-left p-1.5 font-medium text-gray-500 whitespace-nowrap">
                      {shortPrevYear}
                    </td>
                    {allRows.map((row) => (
                      <td
                        key={row.name}
                        className="p-1.5 border border-gray-100"
                      >
                        {fmtMillion(row.previousYear)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-green-50 font-semibold text-gray-900">
                    <td className="text-left p-1.5 whitespace-nowrap">
                      {shortCurrent}
                    </td>
                    {allRows.map((row) => (
                      <td
                        key={row.name}
                        className="p-1.5 border border-gray-100"
                      >
                        {fmtMillion(row.current)}
                      </td>
                    ))}
                  </tr>
                  <tr className="text-[11px]">
                    <td className="text-left p-1.5 font-medium text-gray-400 whitespace-nowrap">
                      前年比
                    </td>
                    {allRows.map((row) => {
                      const yoy = fmtYoY(row.yoyRate)
                      return (
                        <td
                          key={row.name}
                          className={cn(
                            'p-1.5 border border-gray-100',
                            yoy.className
                          )}
                        >
                          {yoy.text}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            棒グラフと表の両方を表示します。
          </p>
        </>
      )}
    </div>
  )
}
