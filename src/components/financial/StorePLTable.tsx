/**
 * 店舗別収支テーブル（転置レイアウト・拡張版）
 * 列: 店舗名（色分け）+ 対売上%、行: 財務項目・前年比・目標比・販管費明細
 */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getStoreMappings } from '@/lib/api/regional'
import { REGION_ORDER } from '@/lib/store-region'
import type { StorePLListResponse, StorePL } from '@/types/financial'
import type { StoreMapping } from '@/types/regional'

interface Props {
  data: StorePLListResponse | null
  loading?: boolean
}

// 店舗カラーパレット
const STORE_COLORS = [
  { bg: 'bg-blue-50', header: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', ratio: 'bg-blue-100/50' },
  { bg: 'bg-green-50', header: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', ratio: 'bg-green-100/50' },
  { bg: 'bg-amber-50', header: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', ratio: 'bg-amber-100/50' },
  { bg: 'bg-purple-50', header: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800', ratio: 'bg-purple-100/50' },
  { bg: 'bg-pink-50', header: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-800', ratio: 'bg-pink-100/50' },
  { bg: 'bg-cyan-50', header: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-800', ratio: 'bg-cyan-100/50' },
  { bg: 'bg-orange-50', header: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-800', ratio: 'bg-orange-100/50' },
  { bg: 'bg-teal-50', header: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-800', ratio: 'bg-teal-100/50' },
  { bg: 'bg-indigo-50', header: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800', ratio: 'bg-indigo-100/50' },
  { bg: 'bg-rose-50', header: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-800', ratio: 'bg-rose-100/50' },
  { bg: 'bg-lime-50', header: 'bg-lime-100', border: 'border-lime-200', text: 'text-lime-800', ratio: 'bg-lime-100/50' },
  { bg: 'bg-sky-50', header: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-800', ratio: 'bg-sky-100/50' },
  { bg: 'bg-violet-50', header: 'bg-violet-100', border: 'border-violet-200', text: 'text-violet-800', ratio: 'bg-violet-100/50' },
  { bg: 'bg-fuchsia-50', header: 'bg-fuchsia-100', border: 'border-fuchsia-200', text: 'text-fuchsia-800', ratio: 'bg-fuchsia-100/50' },
  { bg: 'bg-emerald-50', header: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800', ratio: 'bg-emerald-100/50' },
  { bg: 'bg-red-50', header: 'bg-red-100', border: 'border-red-200', text: 'text-red-800', ratio: 'bg-red-100/50' },
]

// 数値に変換（文字列対応）
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
}

// 数値フォーマット（カンマ区切り、小数点以下なし）
function formatCurrency(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return Math.round(num).toLocaleString('ja-JP')
}

// 前年比フォーマット
function formatYoY(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(1)}%`
}

// 前年差額フォーマット
function formatYoYDiff(current: number | null, prev: number | null): string {
  if (current === null || prev === null) return '-'
  const diff = current - prev
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${Math.round(diff).toLocaleString('ja-JP')}`
}

// 達成率フォーマット
function formatAchievement(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return `${num.toFixed(1)}%`
}

// 対売上比率フォーマット
function formatSalesRatio(value: number | null, sales: number | null): string {
  if (value === null || sales === null || sales === 0) return '-'
  const ratio = (value / sales) * 100
  return `${ratio.toFixed(1)}%`
}

// 前年比の色
function getYoYColor(value: number | null): string {
  if (value === null) return 'text-gray-400'
  return value >= 0 ? 'text-green-600' : 'text-red-600'
}

// 達成率の色
function getAchievementColor(value: number | null): string {
  if (value === null) return 'text-gray-400'
  if (value >= 100) return 'text-green-600'
  if (value >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

// 前年比率計算
function calcYoYRate(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

export function StorePLTable({ data, loading }: Props) {
  const [storeMappings, setStoreMappings] = useState<StoreMapping[]>([])

  // 店舗-地区マッピングを取得
  useEffect(() => {
    getStoreMappings()
      .then((res) => setStoreMappings(res.mappings))
      .catch(() => setStoreMappings([]))
  }, [])

  // 店舗名から地区名を取得する関数
  const getRegionByStoreName = (storeName: string): string | undefined => {
    const mapping = storeMappings.find(
      (m) => m.segment_name === storeName || storeName.includes(m.segment_name) || m.segment_name.includes(storeName)
    )
    return mapping?.region_name
  }

  // 店舗を地区順にソートする関数
  const sortStoresByRegion = (storeList: StorePL[]): StorePL[] => {
    // 地区名から順序を取得
    const getRegionOrder = (regionName: string | undefined): number => {
      if (!regionName) return REGION_ORDER.length + 1
      const idx = REGION_ORDER.indexOf(regionName as typeof REGION_ORDER[number])
      return idx >= 0 ? idx : REGION_ORDER.length
    }

    return [...storeList].sort((a, b) => {
      const regionA = getRegionByStoreName(a.store_name)
      const regionB = getRegionByStoreName(b.store_name)
      const orderA = getRegionOrder(regionA)
      const orderB = getRegionOrder(regionB)

      if (orderA !== orderB) {
        return orderA - orderB
      }
      // 同じ地区内は店舗名でソート
      return a.store_name.localeCompare(b.store_name, 'ja')
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">店舗別収支</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasStores = data && data.stores && data.stores.length > 0
  // 地区順にソート
  const stores = hasStores ? sortStoresByRegion(data.stores) : []

  // 合計を計算
  const totals = {
    sales: data?.total_sales ?? 0,
    cost_of_sales: data?.total_cost_of_sales ?? 0,
    gross_profit: data?.total_gross_profit ?? 0,
    sga_total: data?.total_sga ?? 0,
    operating_profit: data?.total_operating_profit ?? 0,
  }

  // 販管費明細の合計を計算
  const sgaTotals = {
    personnel_cost: stores.reduce((sum, s) => sum + (s.sga_detail?.personnel_cost ?? 0), 0),
    land_rent: stores.reduce((sum, s) => sum + (s.sga_detail?.land_rent ?? 0), 0),
    lease_cost: stores.reduce((sum, s) => sum + (s.sga_detail?.lease_cost ?? 0), 0),
    utilities: stores.reduce((sum, s) => sum + (s.sga_detail?.utilities ?? 0), 0),
    others: stores.reduce((sum, s) => sum + (s.sga_detail?.others ?? 0), 0),
  }

  // ストアセル（金額＋対売上%の2列を返す）
  const renderStoreCell = (
    store: StorePL,
    idx: number,
    value: number | null,
    showRatio: boolean = true,
    isHighlight: boolean = false,
    isNegativeRed: boolean = false
  ) => {
    const color = STORE_COLORS[idx % STORE_COLORS.length]
    const num = toNumber(value)
    return (
      <>
        <TableCell
          className={cn(
            'text-right font-mono',
            isHighlight ? 'bg-opacity-50' : color.bg,
            isNegativeRed && num !== null && num < 0 && 'text-red-600'
          )}
        >
          {formatCurrency(value)}
        </TableCell>
        {showRatio && (
          <TableCell className={cn('text-right font-mono text-xs border-r', color.ratio)}>
            {formatSalesRatio(num, store.sales)}
          </TableCell>
        )}
      </>
    )
  }

  // 合計セル（金額＋対売上%の2列を返す）
  const renderTotalCell = (value: number, showRatio: boolean = true) => {
    return (
      <>
        <TableCell className="text-right font-mono font-bold bg-gray-100">
          {formatCurrency(value)}
        </TableCell>
        {showRatio && (
          <TableCell className="text-right font-mono text-xs bg-gray-100 border-r">
            {formatSalesRatio(value, totals.sales)}
          </TableCell>
        )}
      </>
    )
  }

  // 期間表示文字列を生成
  const getPeriodDisplay = () => {
    if (!data) return ''
    const periodType = data.period_type || 'monthly'
    const startPeriod = data.start_period
    const endPeriod = data.end_period

    if (periodType === 'monthly') {
      return data.period
    }

    if (startPeriod && endPeriod) {
      const start = new Date(startPeriod)
      const end = new Date(endPeriod)
      const startStr = `${start.getFullYear()}年${start.getMonth() + 1}月`
      const endStr = `${end.getFullYear()}年${end.getMonth() + 1}月`

      if (periodType === 'quarterly') {
        return `${startStr} ～ ${endStr}（四半期）`
      }
      if (periodType === 'yearly') {
        return `${startStr} ～ ${endStr}（年度累計）`
      }
    }

    return data.period
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">店舗別収支</CardTitle>
        <p className="text-sm text-gray-500">{getPeriodDisplay()}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="text-sm">
            {/* ヘッダー: 店舗名 */}
            <TableHeader>
              <TableRow className="border-b-2">
                <TableHead className="sticky left-0 bg-white z-20 min-w-[140px] border-r">
                  項目
                </TableHead>
                {hasStores && stores.map((store, idx) => {
                  const color = STORE_COLORS[idx % STORE_COLORS.length]
                  const region = getRegionByStoreName(store.store_name)
                  return (
                    <>
                      <TableHead
                        key={`${store.store_id}-name`}
                        className={cn(
                          'text-center min-w-[100px] whitespace-nowrap',
                          color.header,
                          color.text
                        )}
                      >
                        <div>{store.store_name}</div>
                        {region && (
                          <div className="text-[10px] font-normal opacity-70">{region}</div>
                        )}
                      </TableHead>
                      <TableHead
                        key={`${store.store_id}-ratio`}
                        className={cn(
                          'text-center min-w-[60px] whitespace-nowrap text-xs border-r',
                          color.header,
                          color.text
                        )}
                      >
                        対売上%
                      </TableHead>
                    </>
                  )
                })}
                <TableHead className="text-center min-w-[100px] bg-gray-200 font-bold">
                  合計
                </TableHead>
                <TableHead className="text-center min-w-[60px] bg-gray-200 font-bold text-xs border-r">
                  対売上%
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!hasStores ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-gray-400">
                    店舗別収支データがありません
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* 売上高セクション */}
                  <TableRow className="bg-blue-50/50 font-semibold border-t-2">
                    <TableCell className="sticky left-0 bg-blue-50 z-10 border-r font-bold">
                      売上高
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <>
                          <TableCell key={`${store.store_id}-sales`} className={cn('text-right font-mono', color.bg)}>
                            {formatCurrency(store.sales)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-sales-ratio`} className={cn('text-right font-mono text-xs border-r', color.ratio)}>
                            100.0%
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono font-bold bg-gray-100">
                      {formatCurrency(totals.sales)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs bg-gray-100 border-r">
                      100.0%
                    </TableCell>
                  </TableRow>

                  {/* 売上高 前年同月差額 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年同月差額
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const prevYear = toNumber(store.sales_prev_year)
                      const current = toNumber(store.sales)
                      const diff = current !== null && prevYear !== null ? current - prevYear : null
                      return (
                        <>
                          <TableCell
                            key={`${store.store_id}-sales-diff`}
                            className={cn('text-right font-mono', color.bg, getYoYColor(diff))}
                          >
                            {prevYear !== null ? formatYoYDiff(current, prevYear) : '-'}
                          </TableCell>
                          <TableCell key={`${store.store_id}-sales-diff-ratio`} className={cn('text-right font-mono border-r', color.ratio)}>
                            {/* 差額の対売上%は表示しない */}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r"></TableCell>
                  </TableRow>

                  {/* 売上高 前年比（%） */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年比
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      // APIからの前年比がなければ計算
                      let yoyRate = toNumber(store.sales_yoy_rate)
                      if (yoyRate === null) {
                        yoyRate = calcYoYRate(store.sales, toNumber(store.sales_prev_year))
                      }
                      return (
                        <>
                          <TableCell
                            key={`${store.store_id}-sales-yoy`}
                            className={cn('text-right font-mono', color.bg, getYoYColor(yoyRate))}
                          >
                            {formatYoY(yoyRate)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-sales-yoy-ratio`} className={cn('text-right font-mono border-r', color.ratio)}>
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r"></TableCell>
                  </TableRow>

                  {/* 売上高 目標達成率 */}
                  <TableRow className="text-xs border-b">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      目標達成率
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const rate = toNumber(store.sales_achievement_rate)
                      return (
                        <>
                          <TableCell
                            key={`${store.store_id}-sales-ach`}
                            className={cn('text-right font-mono', color.bg, getAchievementColor(rate))}
                          >
                            {formatAchievement(rate)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-sales-ach-ratio`} className={cn('text-right font-mono border-r', color.ratio)}>
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r"></TableCell>
                  </TableRow>

                  {/* 売上原価 */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-white z-10 border-r font-medium">
                      売上原価
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <>
                          <TableCell key={`${store.store_id}-cogs`} className={cn('text-right font-mono', color.bg)}>
                            {formatCurrency(store.cost_of_sales)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-cogs-ratio`} className={cn('text-right font-mono text-xs border-r', color.ratio)}>
                            {formatSalesRatio(store.cost_of_sales, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    {renderTotalCell(totals.cost_of_sales)}
                  </TableRow>

                  {/* 粗利益 */}
                  <TableRow className="bg-green-50/50 font-semibold border-t">
                    <TableCell className="sticky left-0 bg-green-50 z-10 border-r font-bold">
                      粗利益
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <>
                          <TableCell key={`${store.store_id}-gp`} className={cn('text-right font-mono bg-green-50/50')}>
                            {formatCurrency(store.gross_profit)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-gp-ratio`} className={cn('text-right font-mono text-xs border-r bg-green-100/30')}>
                            {formatSalesRatio(store.gross_profit, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono font-bold bg-green-100">
                      {formatCurrency(totals.gross_profit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs bg-green-100 border-r">
                      {formatSalesRatio(totals.gross_profit, totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費 */}
                  <TableRow className="border-t">
                    <TableCell className="sticky left-0 bg-white z-10 border-r font-medium">
                      販管費計
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <>
                          <TableCell key={`${store.store_id}-sga`} className={cn('text-right font-mono', color.bg)}>
                            {formatCurrency(store.sga_total)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-sga-ratio`} className={cn('text-right font-mono text-xs border-r', color.ratio)}>
                            {formatSalesRatio(store.sga_total, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    {renderTotalCell(totals.sga_total)}
                  </TableRow>

                  {/* 販管費明細: 人件費 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      人件費
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const val = store.sga_detail?.personnel_cost ?? null
                      return (
                        <>
                          <TableCell key={`${store.store_id}-personnel`} className={cn('text-right font-mono bg-gray-50/50')}>
                            {formatCurrency(val)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-personnel-ratio`} className={cn('text-right font-mono border-r bg-gray-100/30')}>
                            {formatSalesRatio(val, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.personnel_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r">
                      {formatSalesRatio(sgaTotals.personnel_cost, totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: 地代家賃 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      地代家賃
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const val = store.sga_detail?.land_rent ?? null
                      return (
                        <>
                          <TableCell key={`${store.store_id}-rent`} className={cn('text-right font-mono bg-gray-50/50')}>
                            {formatCurrency(val)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-rent-ratio`} className={cn('text-right font-mono border-r bg-gray-100/30')}>
                            {formatSalesRatio(val, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.land_rent)}
                    </TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r">
                      {formatSalesRatio(sgaTotals.land_rent, totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: 賃借料 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      賃借料
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const val = store.sga_detail?.lease_cost ?? null
                      return (
                        <>
                          <TableCell key={`${store.store_id}-lease`} className={cn('text-right font-mono bg-gray-50/50')}>
                            {formatCurrency(val)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-lease-ratio`} className={cn('text-right font-mono border-r bg-gray-100/30')}>
                            {formatSalesRatio(val, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.lease_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r">
                      {formatSalesRatio(sgaTotals.lease_cost, totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: 水道光熱費 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      水道光熱費
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const val = store.sga_detail?.utilities ?? null
                      return (
                        <>
                          <TableCell key={`${store.store_id}-utilities`} className={cn('text-right font-mono bg-gray-50/50')}>
                            {formatCurrency(val)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-utilities-ratio`} className={cn('text-right font-mono border-r bg-gray-100/30')}>
                            {formatSalesRatio(val, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.utilities)}
                    </TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r">
                      {formatSalesRatio(sgaTotals.utilities, totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: その他 */}
                  <TableRow className="text-xs border-b">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      その他
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const val = store.sga_detail?.others ?? null
                      return (
                        <>
                          <TableCell key={`${store.store_id}-others`} className={cn('text-right font-mono bg-gray-50/50')}>
                            {formatCurrency(val)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-others-ratio`} className={cn('text-right font-mono border-r bg-gray-100/30')}>
                            {formatSalesRatio(val, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.others)}
                    </TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r">
                      {formatSalesRatio(sgaTotals.others, totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 営業利益セクション */}
                  <TableRow className="bg-amber-50/50 font-semibold border-t-2">
                    <TableCell className="sticky left-0 bg-amber-50 z-10 border-r font-bold">
                      営業利益
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const profit = toNumber(store.operating_profit)
                      return (
                        <>
                          <TableCell
                            key={`${store.store_id}-op`}
                            className={cn(
                              'text-right font-mono bg-amber-50/50',
                              profit !== null && profit < 0 && 'text-red-600'
                            )}
                          >
                            {formatCurrency(store.operating_profit)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-op-ratio`} className={cn('text-right font-mono text-xs border-r bg-amber-100/30')}>
                            {formatSalesRatio(store.operating_profit, store.sales)}
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono font-bold bg-amber-100">
                      {formatCurrency(totals.operating_profit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs bg-amber-100 border-r">
                      {formatSalesRatio(totals.operating_profit, totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 営業利益 前年同月差額 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年同月差額
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const prevYear = toNumber(store.operating_profit_prev_year)
                      const current = toNumber(store.operating_profit)
                      const diff = current !== null && prevYear !== null ? current - prevYear : null
                      return (
                        <>
                          <TableCell
                            key={`${store.store_id}-op-diff`}
                            className={cn('text-right font-mono', color.bg, getYoYColor(diff))}
                          >
                            {prevYear !== null ? formatYoYDiff(current, prevYear) : '-'}
                          </TableCell>
                          <TableCell key={`${store.store_id}-op-diff-ratio`} className={cn('text-right font-mono border-r', color.ratio)}>
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r"></TableCell>
                  </TableRow>

                  {/* 営業利益 前年比（%） */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年比
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      // APIからの前年比がなければ計算
                      let yoyRate = toNumber(store.operating_profit_yoy_rate)
                      if (yoyRate === null) {
                        yoyRate = calcYoYRate(store.operating_profit, toNumber(store.operating_profit_prev_year))
                      }
                      return (
                        <>
                          <TableCell
                            key={`${store.store_id}-op-yoy`}
                            className={cn('text-right font-mono', color.bg, getYoYColor(yoyRate))}
                          >
                            {formatYoY(yoyRate)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-op-yoy-ratio`} className={cn('text-right font-mono border-r', color.ratio)}>
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r"></TableCell>
                  </TableRow>

                  {/* 営業利益 目標達成率 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      目標達成率
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const rate = toNumber(store.operating_profit_achievement_rate)
                      return (
                        <>
                          <TableCell
                            key={`${store.store_id}-op-ach`}
                            className={cn('text-right font-mono', color.bg, getAchievementColor(rate))}
                          >
                            {formatAchievement(rate)}
                          </TableCell>
                          <TableCell key={`${store.store_id}-op-ach-ratio`} className={cn('text-right font-mono border-r', color.ratio)}>
                          </TableCell>
                        </>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                    <TableCell className="text-right font-mono bg-gray-50 border-r"></TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 前年データがない場合の注記 */}
        {hasStores && stores.every(s => s.sales_prev_year === null) && (
          <div className="p-4 text-sm text-gray-500 border-t">
            ※前年同月データがありません。バックエンドから前年データを取得するには、前年同月のデータがアップロードされている必要があります。
          </div>
        )}
      </CardContent>
    </Card>
  )
}
