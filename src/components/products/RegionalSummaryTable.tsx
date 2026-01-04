/**
 * 地区別実績テーブル
 */
'use client'

import { useState, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRegionalSummary } from '@/hooks/useRegional'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PeriodType, RegionalData } from '@/types/regional'

interface Props {
  month: string
  periodType: PeriodType
}

// 数値フォーマット
function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('ja-JP').format(value)
}

function formatRate(value: number | null): string {
  if (value === null || value === undefined) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function formatAchievementRate(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return `${value.toFixed(1)}%`
}

function isPositive(value: number | null): boolean {
  return value !== null && value >= 0
}

export function RegionalSummaryTable({ month, periodType }: Props) {
  const { data, loading, error } = useRegionalSummary(month, periodType)
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())

  const toggleRegion = (regionId: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev)
      if (next.has(regionId)) {
        next.delete(regionId)
      } else {
        next.add(regionId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">地区別実績</CardTitle>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">地区別実績</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  const hasData = data && data.regions && data.regions.length > 0
  const hasGrandTotal = data && data.grand_total

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">地区別実績</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead
                  rowSpan={2}
                  className="sticky left-0 z-20 bg-white border-r-2 border-gray-300 align-bottom w-[120px]"
                >
                  <div className="py-1">地区/店舗</div>
                </TableHead>
                <TableHead
                  colSpan={5}
                  className="text-center bg-emerald-50 text-emerald-800 font-bold border-r-2 border-gray-300 py-1"
                >
                  売上高
                </TableHead>
                <TableHead
                  colSpan={3}
                  className="text-center bg-blue-50 text-blue-800 font-bold border-r-2 border-gray-300 py-1"
                >
                  購入者数
                </TableHead>
                <TableHead
                  colSpan={2}
                  className="text-center bg-amber-50 text-amber-800 font-bold py-1"
                >
                  客単価
                </TableHead>
              </TableRow>
              <TableRow>
                {/* 売上高 */}
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[90px]">
                  実績
                </TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[90px]">
                  前年
                </TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[65px]">
                  前年比
                </TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[90px]">
                  目標差
                </TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[65px] border-r-2 border-gray-300">
                  達成率
                </TableHead>
                {/* 購入者数 */}
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[65px]">
                  実績
                </TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[65px]">
                  前年
                </TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[65px] border-r-2 border-gray-300">
                  前年比
                </TableHead>
                {/* 客単価 */}
                <TableHead className="text-right bg-amber-50/50 py-1 px-2 w-[80px]">
                  実績
                </TableHead>
                <TableHead className="text-right bg-amber-50/50 py-1 px-2 w-[80px]">
                  前年
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasData ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-400">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.regions.map((region) => {
                    const isOpen = expandedRegions.has(region.region_id)
                    const hasStores = region.stores && region.stores.length > 0

                    return (
                      <Fragment key={region.region_id}>
                        {/* 地区行 */}
                        <TableRow
                          onClick={() => hasStores && toggleRegion(region.region_id)}
                          className={cn(
                            'hover:bg-gray-50 font-medium bg-blue-50/50',
                            hasStores && 'cursor-pointer',
                            isOpen && 'bg-blue-100/50'
                          )}
                        >
                          <TableCell className="sticky left-0 z-10 bg-inherit border-r-2 border-gray-300 py-1.5 px-2 w-[120px]">
                            <div className="flex items-center gap-1">
                              {hasStores ? (
                                isOpen ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                )
                              ) : (
                                <span className="w-4" />
                              )}
                              <span className="truncate">{region.region_name}</span>
                            </div>
                          </TableCell>
                          {/* 売上高 */}
                          <TableCell className="text-right font-mono py-1.5 px-2">
                            {formatCurrency(region.total_sales)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                            {formatCurrency(region.total_sales_previous_year)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-mono py-1.5 px-2',
                              isPositive(region.sales_yoy_rate) ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {formatRate(region.sales_yoy_rate)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-mono py-1.5 px-2',
                              isPositive(region.target_diff) ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {formatCurrency(region.target_diff)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-mono py-1.5 px-2 border-r-2 border-gray-300',
                              region.target_achievement_rate !== null &&
                                region.target_achievement_rate >= 100
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}
                          >
                            {formatAchievementRate(region.target_achievement_rate)}
                          </TableCell>
                          {/* 購入者数 */}
                          <TableCell className="text-right font-mono py-1.5 px-2">
                            {formatNumber(region.total_customers)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                            {formatNumber(region.total_customers_previous_year)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-mono py-1.5 px-2 border-r-2 border-gray-300',
                              isPositive(region.customers_yoy_rate) ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {formatRate(region.customers_yoy_rate)}
                          </TableCell>
                          {/* 客単価 */}
                          <TableCell className="text-right font-mono py-1.5 px-2">
                            {formatCurrency(region.avg_unit_price)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                            {formatCurrency(region.avg_unit_price_previous_year)}
                          </TableCell>
                        </TableRow>
                        {/* 店舗行（展開時のみ表示） */}
                        {isOpen &&
                          region.stores.map((store) => (
                            <TableRow
                              key={`${region.region_id}-${store.segment_id}`}
                              className="hover:bg-gray-50 bg-white text-gray-600"
                            >
                              <TableCell className="sticky left-0 z-10 bg-white border-r-2 border-gray-300 py-1 px-2 pl-8 w-[120px]">
                                <div className="truncate text-xs" title={store.segment_name}>
                                  {store.segment_name}
                                </div>
                              </TableCell>
                              {/* 売上高 */}
                              <TableCell className="text-right font-mono text-xs py-1 px-2">
                                {formatCurrency(store.sales)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-gray-400 py-1 px-2">
                                {formatCurrency(store.sales_previous_year)}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  'text-right font-mono text-xs py-1 px-2',
                                  isPositive(store.sales_yoy_rate) ? 'text-green-600' : 'text-red-600'
                                )}
                              >
                                {formatRate(store.sales_yoy_rate)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs py-1 px-2">-</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1 px-2 border-r-2 border-gray-300">
                                -
                              </TableCell>
                              {/* 購入者数 */}
                              <TableCell className="text-right font-mono text-xs py-1 px-2">
                                {formatNumber(store.customers)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-gray-400 py-1 px-2">
                                {formatNumber(store.customers_previous_year)}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  'text-right font-mono text-xs py-1 px-2 border-r-2 border-gray-300',
                                  isPositive(store.customers_yoy_rate) ? 'text-green-600' : 'text-red-600'
                                )}
                              >
                                {formatRate(store.customers_yoy_rate)}
                              </TableCell>
                              {/* 客単価 */}
                              <TableCell className="text-right font-mono text-xs py-1 px-2">
                                {formatCurrency(store.unit_price)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-gray-400 py-1 px-2">
                                {formatCurrency(store.unit_price_previous_year)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </Fragment>
                    )
                  })}
                  {/* 合計行 */}
                  {hasGrandTotal && (
                    <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-400">
                      <TableCell className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 py-1.5 px-2 w-[120px]">
                        合計
                      </TableCell>
                      {/* 売上高 */}
                      <TableCell className="text-right font-mono py-1.5 px-2">
                        {formatCurrency(data.grand_total.total_sales)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                        {formatCurrency(data.grand_total.total_sales_previous_year)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-mono py-1.5 px-2',
                          isPositive(data.grand_total.sales_yoy_rate)
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {formatRate(data.grand_total.sales_yoy_rate)}
                      </TableCell>
                      <TableCell className="text-right font-mono py-1.5 px-2">-</TableCell>
                      <TableCell className="text-right font-mono py-1.5 px-2 border-r-2 border-gray-300">
                        -
                      </TableCell>
                      {/* 購入者数 */}
                      <TableCell className="text-right font-mono py-1.5 px-2">
                        {formatNumber(data.grand_total.total_customers)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                        {formatNumber(data.grand_total.total_customers_previous_year)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-mono py-1.5 px-2 border-r-2 border-gray-300',
                          isPositive(data.grand_total.customers_yoy_rate)
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {formatRate(data.grand_total.customers_yoy_rate)}
                      </TableCell>
                      {/* 客単価 */}
                      <TableCell className="text-right font-mono py-1.5 px-2">
                        {formatCurrency(data.grand_total.avg_unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                        -
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
