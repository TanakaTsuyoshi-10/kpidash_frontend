/**
 * 店舗別売上集計テーブル
 * 店舗ごとの売上高、客数、客単価と前年対比を表示
 * 単月/累計切替、ソート機能付き
 */
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useStoreSummary, PeriodType } from '@/hooks/useStoreSummary'
import { cn } from '@/lib/utils'

interface Props {
  month: string
  departmentSlug?: string
}

type SortKey =
  | 'segment_name'
  | 'sales' | 'sales_yoy'
  | 'customers' | 'customers_yoy'
  | 'unit_price' | 'unit_price_yoy'
type SortOrder = 'asc' | 'desc'

// 通貨フォーマット
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return `¥${value.toLocaleString()}`
}

// 数値フォーマット
function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString()
}

// 前年比フォーマット（変化率: 0基準）
function formatYoYPercent(rate: number | null | undefined): string {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

// 前年差分フォーマット（実数）
function formatYoYDiff(current: number | null | undefined, previous: number | null | undefined): string {
  if (current == null || previous == null) return '-'
  const diff = current - previous
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toLocaleString()}`
}

// 前年比が0以上かどうか
function isPositiveYoY(rate: number | null | undefined): boolean {
  return rate != null && rate >= 0
}

export function StoreSummaryTable({ month, departmentSlug = 'store' }: Props) {
  // 単月/累計切替
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')

  const { data, loading, error } = useStoreSummary(month, departmentSlug, periodType)

  // ソート状態
  const [sortKey, setSortKey] = useState<SortKey>('sales')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // ソート済みデータ
  const sortedStores = useMemo(() => {
    if (!data?.stores) return []

    const sorted = [...data.stores]
    sorted.sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortKey) {
        case 'segment_name':
          aVal = a.segment_name
          bVal = b.segment_name
          break
        case 'sales':
          aVal = a.sales ?? -Infinity
          bVal = b.sales ?? -Infinity
          break
        case 'sales_yoy':
          aVal = a.sales_yoy ?? -Infinity
          bVal = b.sales_yoy ?? -Infinity
          break
        case 'customers':
          aVal = a.customers ?? -Infinity
          bVal = b.customers ?? -Infinity
          break
        case 'customers_yoy':
          aVal = a.customers_yoy ?? -Infinity
          bVal = b.customers_yoy ?? -Infinity
          break
        case 'unit_price':
          aVal = a.unit_price ?? -Infinity
          bVal = b.unit_price ?? -Infinity
          break
        case 'unit_price_yoy':
          aVal = a.unit_price_yoy ?? -Infinity
          bVal = b.unit_price_yoy ?? -Infinity
          break
      }

      if (aVal === null || bVal === null) return 0
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [data?.stores, sortKey, sortOrder])

  // ソートハンドラ
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  // ソートアイコン
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="h-3 w-3 ml-1" />
      : <ChevronDown className="h-3 w-3 ml-1" />
  }

  // 日付をパース
  const [year, monthNum] = month.substring(0, 7).split('-').map(Number)

  // 会計年度の開始年を計算（9月起点）
  // 9月以降は当年開始、1-8月は前年開始
  const fiscalYearStart = monthNum >= 9 ? year : year - 1

  // 累計モードかどうか
  const isCumulative = periodType === 'cumulative'

  // タイトル
  const title = isCumulative
    ? `店舗別売上集計 累計（${fiscalYearStart}/9〜${year}/${monthNum}）`
    : `店舗別売上集計（${year}/${monthNum}）`

  // 期間タイプ切り替えボタン
  const PeriodTypeToggle = () => (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
      <button
        onClick={() => setPeriodType('monthly')}
        className={cn(
          'px-3 py-1 text-sm font-medium transition-colors whitespace-nowrap',
          periodType === 'monthly'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        単月
      </button>
      <button
        onClick={() => setPeriodType('cumulative')}
        className={cn(
          'px-3 py-1 text-sm font-medium transition-colors border-l border-gray-200 whitespace-nowrap',
          periodType === 'cumulative'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        累計
      </button>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg shrink-0">{title}</CardTitle>
            <PeriodTypeToggle />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg shrink-0">{title}</CardTitle>
            <PeriodTypeToggle />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.stores.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg shrink-0">{title}</CardTitle>
            <PeriodTypeToggle />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  // グループ別の列数
  const colsPerGroup = isCumulative ? 6 : 4

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg shrink-0">{title}</CardTitle>
          <PeriodTypeToggle />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              {/* グループヘッダー行 */}
              <TableRow className="border-b-0">
                <TableHead
                  rowSpan={2}
                  className="sticky left-0 z-20 bg-white border-r-2 border-gray-300 align-bottom cursor-pointer hover:bg-gray-50 min-w-[100px]"
                  onClick={() => handleSort('segment_name')}
                >
                  <div className="flex items-center py-1">
                    店舗名
                    <SortIcon columnKey="segment_name" />
                  </div>
                </TableHead>
                <TableHead
                  colSpan={colsPerGroup}
                  className="text-center bg-emerald-50 text-emerald-800 font-bold border-r-2 border-gray-300 py-1"
                >
                  売上高
                </TableHead>
                <TableHead
                  colSpan={colsPerGroup}
                  className="text-center bg-blue-50 text-blue-800 font-bold border-r-2 border-gray-300 py-1"
                >
                  客数
                </TableHead>
                <TableHead
                  colSpan={colsPerGroup}
                  className="text-center bg-amber-50 text-amber-800 font-bold py-1"
                >
                  客単価
                </TableHead>
              </TableRow>
              {/* サブヘッダー行 */}
              <TableRow>
                {/* 売上高 */}
                <TableHead
                  className="text-right bg-emerald-50/50 py-1 px-2 cursor-pointer hover:bg-emerald-100 whitespace-nowrap"
                  onClick={() => handleSort('sales')}
                >
                  <div className="flex items-center justify-end">
                    実績
                    <SortIcon columnKey="sales" />
                  </div>
                </TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 whitespace-nowrap">前年</TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-emerald-50/50 py-1 px-2 whitespace-nowrap">前々年</TableHead>
                )}
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 whitespace-nowrap">前年差</TableHead>
                <TableHead
                  className={cn(
                    "text-right bg-emerald-50/50 py-1 px-2 cursor-pointer hover:bg-emerald-100 whitespace-nowrap",
                    !isCumulative && "border-r-2 border-gray-300"
                  )}
                  onClick={() => handleSort('sales_yoy')}
                >
                  <div className="flex items-center justify-end">
                    前年比
                    <SortIcon columnKey="sales_yoy" />
                  </div>
                </TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-emerald-50/50 py-1 px-2 border-r-2 border-gray-300 whitespace-nowrap">前々年比</TableHead>
                )}

                {/* 客数 */}
                <TableHead
                  className="text-right bg-blue-50/50 py-1 px-2 cursor-pointer hover:bg-blue-100 whitespace-nowrap"
                  onClick={() => handleSort('customers')}
                >
                  <div className="flex items-center justify-end">
                    実績
                    <SortIcon columnKey="customers" />
                  </div>
                </TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 whitespace-nowrap">前年</TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-blue-50/50 py-1 px-2 whitespace-nowrap">前々年</TableHead>
                )}
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 whitespace-nowrap">前年差</TableHead>
                <TableHead
                  className={cn(
                    "text-right bg-blue-50/50 py-1 px-2 cursor-pointer hover:bg-blue-100 whitespace-nowrap",
                    !isCumulative && "border-r-2 border-gray-300"
                  )}
                  onClick={() => handleSort('customers_yoy')}
                >
                  <div className="flex items-center justify-end">
                    前年比
                    <SortIcon columnKey="customers_yoy" />
                  </div>
                </TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-blue-50/50 py-1 px-2 border-r-2 border-gray-300 whitespace-nowrap">前々年比</TableHead>
                )}

                {/* 客単価 */}
                <TableHead
                  className="text-right bg-amber-50/50 py-1 px-2 cursor-pointer hover:bg-amber-100 whitespace-nowrap"
                  onClick={() => handleSort('unit_price')}
                >
                  <div className="flex items-center justify-end">
                    実績
                    <SortIcon columnKey="unit_price" />
                  </div>
                </TableHead>
                <TableHead className="text-right bg-amber-50/50 py-1 px-2 whitespace-nowrap">前年</TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-amber-50/50 py-1 px-2 whitespace-nowrap">前々年</TableHead>
                )}
                <TableHead className="text-right bg-amber-50/50 py-1 px-2 whitespace-nowrap">前年差</TableHead>
                <TableHead
                  className="text-right bg-amber-50/50 py-1 px-2 cursor-pointer hover:bg-amber-100 whitespace-nowrap"
                  onClick={() => handleSort('unit_price_yoy')}
                >
                  <div className="flex items-center justify-end">
                    前年比
                    <SortIcon columnKey="unit_price_yoy" />
                  </div>
                </TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-amber-50/50 py-1 px-2 whitespace-nowrap">前々年比</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStores.map((store) => (
                <TableRow key={store.segment_id} className="hover:bg-gray-50">
                  <TableCell className="sticky left-0 z-10 bg-white border-r-2 border-gray-300 font-medium py-1.5 px-2">
                    <Link
                      href={`/products/${store.segment_id}?month=${month}`}
                      className="text-green-600 hover:text-green-800 hover:underline whitespace-nowrap"
                    >
                      {store.segment_name}
                    </Link>
                  </TableCell>
                  {/* 売上高 */}
                  <TableCell className="text-right font-mono py-1.5 px-2">
                    {formatCurrency(store.sales)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {formatCurrency(store.sales_previous_year)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                      {formatCurrency(store.sales_two_years_ago)}
                    </TableCell>
                  )}
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2',
                    isPositiveYoY(store.sales_yoy) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoYDiff(store.sales, store.sales_previous_year)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2',
                    isPositiveYoY(store.sales_yoy) ? 'text-green-600' : 'text-red-600',
                    !isCumulative && 'border-r-2 border-gray-300'
                  )}>
                    {formatYoYPercent(store.sales_yoy)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className={cn(
                      'text-right font-mono py-1.5 px-2 border-r-2 border-gray-300',
                      isPositiveYoY(store.sales_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatYoYPercent(store.sales_yoy_two_years)}
                    </TableCell>
                  )}
                  {/* 客数 */}
                  <TableCell className="text-right font-mono py-1.5 px-2">
                    {formatNumber(store.customers)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {formatNumber(store.customers_previous_year)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                      {formatNumber(store.customers_two_years_ago)}
                    </TableCell>
                  )}
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2',
                    isPositiveYoY(store.customers_yoy) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoYDiff(store.customers, store.customers_previous_year)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2',
                    isPositiveYoY(store.customers_yoy) ? 'text-green-600' : 'text-red-600',
                    !isCumulative && 'border-r-2 border-gray-300'
                  )}>
                    {formatYoYPercent(store.customers_yoy)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className={cn(
                      'text-right font-mono py-1.5 px-2 border-r-2 border-gray-300',
                      isPositiveYoY(store.customers_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatYoYPercent(store.customers_yoy_two_years)}
                    </TableCell>
                  )}
                  {/* 客単価 */}
                  <TableCell className="text-right font-mono py-1.5 px-2">
                    {formatCurrency(store.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {formatCurrency(store.unit_price_previous_year)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                      {formatCurrency(store.unit_price_two_years_ago)}
                    </TableCell>
                  )}
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2',
                    isPositiveYoY(store.unit_price_yoy) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoYDiff(store.unit_price, store.unit_price_previous_year)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2',
                    isPositiveYoY(store.unit_price_yoy) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoYPercent(store.unit_price_yoy)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className={cn(
                      'text-right font-mono py-1.5 px-2',
                      isPositiveYoY(store.unit_price_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatYoYPercent(store.unit_price_yoy_two_years)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* 合計行 */}
              <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-400">
                <TableCell className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 py-1.5 px-2">
                  合計
                </TableCell>
                {/* 売上高 */}
                <TableCell className="text-right font-mono py-1.5 px-2">
                  {formatCurrency(data.totals.sales)}
                </TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                  {formatCurrency(data.totals.sales_previous_year)}
                </TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                    {formatCurrency(data.totals.sales_two_years_ago)}
                  </TableCell>
                )}
                <TableCell className={cn(
                  'text-right font-mono py-1.5 px-2',
                  isPositiveYoY(data.totals.sales_yoy) ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatYoYDiff(data.totals.sales, data.totals.sales_previous_year)}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-mono py-1.5 px-2',
                  isPositiveYoY(data.totals.sales_yoy) ? 'text-green-600' : 'text-red-600',
                  !isCumulative && 'border-r-2 border-gray-300'
                )}>
                  {formatYoYPercent(data.totals.sales_yoy)}
                </TableCell>
                {isCumulative && (
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2 border-r-2 border-gray-300',
                    isPositiveYoY(data.totals.sales_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoYPercent(data.totals.sales_yoy_two_years)}
                  </TableCell>
                )}
                {/* 客数 */}
                <TableCell className="text-right font-mono py-1.5 px-2">
                  {formatNumber(data.totals.customers)}
                </TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                  {formatNumber(data.totals.customers_previous_year)}
                </TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                    {formatNumber(data.totals.customers_two_years_ago)}
                  </TableCell>
                )}
                <TableCell className={cn(
                  'text-right font-mono py-1.5 px-2',
                  isPositiveYoY(data.totals.customers_yoy) ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatYoYDiff(data.totals.customers, data.totals.customers_previous_year)}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-mono py-1.5 px-2',
                  isPositiveYoY(data.totals.customers_yoy) ? 'text-green-600' : 'text-red-600',
                  !isCumulative && 'border-r-2 border-gray-300'
                )}>
                  {formatYoYPercent(data.totals.customers_yoy)}
                </TableCell>
                {isCumulative && (
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2 border-r-2 border-gray-300',
                    isPositiveYoY(data.totals.customers_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoYPercent(data.totals.customers_yoy_two_years)}
                  </TableCell>
                )}
                {/* 客単価 */}
                <TableCell className="text-right font-mono py-1.5 px-2">
                  {formatCurrency(data.totals.unit_price)}
                </TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                  {formatCurrency(data.totals.unit_price_previous_year)}
                </TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                    {formatCurrency(data.totals.unit_price_two_years_ago)}
                  </TableCell>
                )}
                <TableCell className={cn(
                  'text-right font-mono py-1.5 px-2',
                  isPositiveYoY(data.totals.unit_price_yoy) ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatYoYDiff(data.totals.unit_price, data.totals.unit_price_previous_year)}
                </TableCell>
                <TableCell className={cn(
                  'text-right font-mono py-1.5 px-2',
                  isPositiveYoY(data.totals.unit_price_yoy) ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatYoYPercent(data.totals.unit_price_yoy)}
                </TableCell>
                {isCumulative && (
                  <TableCell className={cn(
                    'text-right font-mono py-1.5 px-2',
                    isPositiveYoY(data.totals.unit_price_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoYPercent(data.totals.unit_price_yoy_two_years)}
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
