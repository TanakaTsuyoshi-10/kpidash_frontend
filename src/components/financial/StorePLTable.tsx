/**
 * 店舗別収支テーブル（転置レイアウト・拡張版）
 * 列: 店舗名（色分け）、行: 財務項目・前年比・目標比・販管費明細
 */
'use client'

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
import type { StorePLListResponse, StorePL } from '@/types/financial'

interface Props {
  data: StorePLListResponse | null
  loading?: boolean
}

// 店舗カラーパレット
const STORE_COLORS = [
  { bg: 'bg-blue-50', header: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' },
  { bg: 'bg-green-50', header: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
  { bg: 'bg-amber-50', header: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800' },
  { bg: 'bg-purple-50', header: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800' },
  { bg: 'bg-pink-50', header: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-800' },
  { bg: 'bg-cyan-50', header: 'bg-cyan-100', border: 'border-cyan-200', text: 'text-cyan-800' },
  { bg: 'bg-orange-50', header: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-800' },
  { bg: 'bg-teal-50', header: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-800' },
  { bg: 'bg-indigo-50', header: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800' },
  { bg: 'bg-rose-50', header: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-800' },
  { bg: 'bg-lime-50', header: 'bg-lime-100', border: 'border-lime-200', text: 'text-lime-800' },
  { bg: 'bg-sky-50', header: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-800' },
  { bg: 'bg-violet-50', header: 'bg-violet-100', border: 'border-violet-200', text: 'text-violet-800' },
  { bg: 'bg-fuchsia-50', header: 'bg-fuchsia-100', border: 'border-fuchsia-200', text: 'text-fuchsia-800' },
  { bg: 'bg-emerald-50', header: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-800' },
  { bg: 'bg-red-50', header: 'bg-red-100', border: 'border-red-200', text: 'text-red-800' },
]

// 数値に変換（文字列対応）
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
}

// 数値フォーマット（カンマ区切り＋円、小数点以下なし）
function formatCurrency(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return `¥${Math.round(num).toLocaleString('ja-JP')}`
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
  return `${sign}¥${Math.round(diff).toLocaleString('ja-JP')}`
}

// 達成率フォーマット
function formatAchievement(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return `${num.toFixed(1)}%`
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

// 前年比計算
function calcYoYRate(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

export function StorePLTable({ data, loading }: Props) {
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
  const stores = data?.stores ?? []

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">店舗別収支</CardTitle>
        {data?.period && <p className="text-sm text-gray-500">{data.period}</p>}
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
                  return (
                    <TableHead
                      key={store.store_id}
                      className={cn(
                        'text-center min-w-[120px] whitespace-nowrap border-r',
                        color.header,
                        color.text
                      )}
                    >
                      {store.store_name}
                    </TableHead>
                  )
                })}
                <TableHead className="text-center min-w-[120px] bg-gray-200 font-bold">
                  合計
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
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg)}>
                          {formatCurrency(store.sales)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono font-bold bg-gray-100">
                      {formatCurrency(totals.sales)}
                    </TableCell>
                  </TableRow>

                  {/* 売上高 前年比（金額） */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年差額
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const diff = store.sales - (store.sales_prev_year ?? store.sales)
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg, getYoYColor(diff))}>
                          {store.sales_prev_year ? formatYoYDiff(store.sales, store.sales_prev_year) : '-'}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                  </TableRow>

                  {/* 売上高 前年比（%） */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年比
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const yoyRate = toNumber(store.sales_yoy_rate)
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg, getYoYColor(yoyRate))}>
                          {formatYoY(store.sales_yoy_rate)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
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
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg, getAchievementColor(rate))}>
                          {formatAchievement(store.sales_achievement_rate)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                  </TableRow>

                  {/* 売上原価 */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-white z-10 border-r font-medium">
                      売上原価
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg)}>
                          {formatCurrency(store.cost_of_sales)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-100">
                      {formatCurrency(totals.cost_of_sales)}
                    </TableCell>
                  </TableRow>

                  {/* 粗利益 */}
                  <TableRow className="bg-green-50/50 font-semibold border-t">
                    <TableCell className="sticky left-0 bg-green-50 z-10 border-r font-bold">
                      粗利益
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r bg-green-50/50')}>
                          {formatCurrency(store.gross_profit)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono font-bold bg-green-100">
                      {formatCurrency(totals.gross_profit)}
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
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg)}>
                          {formatCurrency(store.sga_total)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-100">
                      {formatCurrency(totals.sga_total)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: 人件費 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      人件費
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r bg-gray-50/50')}>
                          {formatCurrency(store.sga_detail?.personnel_cost)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.personnel_cost)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: 地代家賃 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      地代家賃
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r bg-gray-50/50')}>
                          {formatCurrency(store.sga_detail?.land_rent)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.land_rent)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: 賃借料 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      賃借料
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r bg-gray-50/50')}>
                          {formatCurrency(store.sga_detail?.lease_cost)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.lease_cost)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: 水道光熱費 */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      水道光熱費
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r bg-gray-50/50')}>
                          {formatCurrency(store.sga_detail?.utilities)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.utilities)}
                    </TableCell>
                  </TableRow>

                  {/* 販管費明細: その他 */}
                  <TableRow className="text-xs border-b">
                    <TableCell className="sticky left-0 bg-gray-50 z-10 border-r pl-6 text-gray-600">
                      その他
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r bg-gray-50/50')}>
                          {formatCurrency(store.sga_detail?.others)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">
                      {formatCurrency(sgaTotals.others)}
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
                        <TableCell key={store.store_id} className={cn(
                          'text-right font-mono border-r bg-amber-50/50',
                          profit !== null && profit < 0 && 'text-red-600'
                        )}>
                          {formatCurrency(store.operating_profit)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono font-bold bg-amber-100">
                      {formatCurrency(totals.operating_profit)}
                    </TableCell>
                  </TableRow>

                  {/* 営業利益 前年比（金額） */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年差額
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const diff = store.operating_profit - (store.operating_profit_prev_year ?? store.operating_profit)
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg, getYoYColor(diff))}>
                          {store.operating_profit_prev_year ? formatYoYDiff(store.operating_profit, store.operating_profit_prev_year) : '-'}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                  </TableRow>

                  {/* 営業利益 前年比（%） */}
                  <TableRow className="text-xs">
                    <TableCell className="sticky left-0 bg-white z-10 border-r pl-4 text-gray-500">
                      前年比
                    </TableCell>
                    {stores.map((store, idx) => {
                      const color = STORE_COLORS[idx % STORE_COLORS.length]
                      const yoyRate = toNumber(store.operating_profit_yoy_rate)
                      return (
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg, getYoYColor(yoyRate))}>
                          {formatYoY(store.operating_profit_yoy_rate)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
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
                        <TableCell key={store.store_id} className={cn('text-right font-mono border-r', color.bg, getAchievementColor(rate))}>
                          {formatAchievement(store.operating_profit_achievement_rate)}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-mono bg-gray-50">-</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
