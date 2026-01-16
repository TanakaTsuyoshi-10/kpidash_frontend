/**
 * 展開可能な損益サマリーテーブル
 * 売上原価と販管費の明細を展開表示
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
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  FinancialAnalysisResponseV2,
  CostOfSalesDetail,
  SGADetail,
} from '@/types/financial'

interface Props {
  data: FinancialAnalysisResponseV2 | null
  loading?: boolean
}

// 展開可能な行のキー
type ExpandableRowKey = 'cost_of_sales' | 'sga'

// 明細行の型
interface DetailItem {
  name: string
  current: number
  previous: number | null
}

// 文字列/数値をnumberに変換
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

// 前年比フォーマット（変化率: 0基準）
function formatYoY(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(1)}%`
}

// 前年比の色
function getYoYColor(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return 'text-gray-500'
  return num >= 0 ? 'text-green-600' : 'text-red-600'
}

// 達成率フォーマット
function formatAchievementRate(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return `${num.toFixed(1)}%`
}

// 達成率の色
function getAchievementRateColor(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return 'text-gray-400'
  if (num >= 100) return 'text-green-600'
  if (num >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

// YoY計算
function calculateYoY(current: number | string | null | undefined, previous: number | string | null | undefined): number | null {
  const curr = toNumber(current)
  const prev = toNumber(previous)
  if (curr === null || prev === null || prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

// 対売上比率計算
function calculateSalesRatio(value: number | string | null | undefined, salesTotal: number | string | null | undefined): number | null {
  const val = toNumber(value)
  const sales = toNumber(salesTotal)
  if (val === null || sales === null || sales === 0) return null
  return (val / sales) * 100
}

// 対売上比率フォーマット
function formatSalesRatio(value: number | null): string {
  if (value === null) return '-'
  return `${value.toFixed(1)}%`
}

export function ExpandablePLSummaryTable({ data, loading }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<ExpandableRowKey>>(new Set())

  const toggleRow = (key: ExpandableRowKey) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">損益サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">損益サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  const { current, previous_year, target } = data

  // 売上原価明細を取得
  const getCostOfSalesDetails = (): DetailItem[] => {
    const curr = current.cost_of_sales_detail
    const prev = previous_year?.cost_of_sales_detail

    if (!curr) return []

    return [
      { name: '仕入高', current: curr.purchases, previous: prev?.purchases ?? null },
      { name: '原材料仕入高', current: curr.raw_material_purchases, previous: prev?.raw_material_purchases ?? null },
      { name: '労務費', current: curr.labor_cost, previous: prev?.labor_cost ?? null },
      { name: '消耗品費', current: curr.consumables, previous: prev?.consumables ?? null },
      { name: '賃借料', current: curr.rent, previous: prev?.rent ?? null },
      { name: '修繕費', current: curr.repairs, previous: prev?.repairs ?? null },
      { name: '水道光熱費', current: curr.utilities, previous: prev?.utilities ?? null },
      { name: 'その他', current: curr.others, previous: prev?.others ?? null },
    ].filter(item => item.current !== 0)
  }

  // 販管費明細を取得
  const getSGADetails = (): DetailItem[] => {
    const curr = current.sga_detail
    const prev = previous_year?.sga_detail

    if (!curr) return []

    return [
      { name: '役員報酬', current: curr.executive_compensation, previous: prev?.executive_compensation ?? null },
      { name: '人件費', current: curr.personnel_cost, previous: prev?.personnel_cost ?? null },
      { name: '配送費', current: curr.delivery_cost, previous: prev?.delivery_cost ?? null },
      { name: '包装費', current: curr.packaging_cost, previous: prev?.packaging_cost ?? null },
      { name: '支払手数料', current: curr.payment_fees, previous: prev?.payment_fees ?? null },
      { name: '荷造運賃費', current: curr.freight_cost, previous: prev?.freight_cost ?? null },
      { name: '販売手数料', current: curr.sales_commission, previous: prev?.sales_commission ?? null },
      { name: '広告宣伝費', current: curr.advertising_cost, previous: prev?.advertising_cost ?? null },
      { name: 'その他', current: curr.others, previous: prev?.others ?? null },
    ].filter(item => item.current !== 0)
  }

  const costOfSalesDetails = getCostOfSalesDetails()
  const sgaDetails = getSGADetails()
  const isCostOfSalesOpen = expandedRows.has('cost_of_sales')
  const isSGAOpen = expandedRows.has('sga')

  // 売上総利益
  const grossProfit = current.gross_profit
  const grossProfitPrev = previous_year?.gross_profit ?? null
  const grossProfitYoY = data.gross_profit_yoy_rate

  // 営業利益
  const operatingProfit = current.operating_profit
  const operatingProfitPrev = previous_year?.operating_profit ?? null
  const operatingProfitYoY = data.operating_profit_yoy_rate

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">損益サマリー</CardTitle>
        <p className="text-sm text-gray-500">{data.period}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">項目</TableHead>
              <TableHead className="text-right">実績</TableHead>
              <TableHead className="text-right">対売上比</TableHead>
              <TableHead className="text-right">目標</TableHead>
              <TableHead className="text-right">達成率</TableHead>
              <TableHead className="text-right">前年</TableHead>
              <TableHead className="text-right">前年比</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 売上高 */}
            <TableRow>
              <TableCell className="font-medium">売上高</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(current.sales_total)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                100.0%
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(target?.sales_total ?? null)}
              </TableCell>
              <TableCell className={cn('text-right font-mono font-medium', getAchievementRateColor(data.sales_achievement_rate))}>
                {formatAchievementRate(data.sales_achievement_rate)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(previous_year?.sales_total ?? null)}
              </TableCell>
              <TableCell className={cn('text-right font-mono', getYoYColor(data.sales_yoy_rate))}>
                {formatYoY(data.sales_yoy_rate)}
              </TableCell>
            </TableRow>

            {/* 売上原価（展開可能） */}
            <TableRow
              onClick={() => toggleRow('cost_of_sales')}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-1">
                  {isCostOfSalesOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span>売上原価</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(current.cost_of_sales)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatSalesRatio(calculateSalesRatio(current.cost_of_sales, current.sales_total))}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(target?.cost_of_sales ?? null)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-400">
                -
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(previous_year?.cost_of_sales ?? null)}
              </TableCell>
              <TableCell className={cn('text-right font-mono', getYoYColor(calculateYoY(current.cost_of_sales, previous_year?.cost_of_sales ?? null)))}>
                {formatYoY(calculateYoY(current.cost_of_sales, previous_year?.cost_of_sales ?? null))}
              </TableCell>
            </TableRow>

            {/* 売上原価明細（展開時） */}
            {isCostOfSalesOpen && (
              costOfSalesDetails.length > 0 ? (
                costOfSalesDetails.map((item) => (
                  <TableRow key={item.name} className="bg-gray-50/50">
                    <TableCell className="pl-8 text-sm text-gray-600">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">
                      {formatCurrency(item.current)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      {formatSalesRatio(calculateSalesRatio(item.current, current.sales_total))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      {formatCurrency(item.previous)}
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-sm', getYoYColor(calculateYoY(item.current, item.previous)))}>
                      {formatYoY(calculateYoY(item.current, item.previous))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="bg-gray-50/50">
                  <TableCell colSpan={7} className="text-center text-sm text-gray-400 py-2">
                    明細データがありません
                  </TableCell>
                </TableRow>
              )
            )}

            {/* 売上総利益 */}
            <TableRow className="bg-gray-50 font-medium">
              <TableCell className="font-medium">売上総利益</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(grossProfit)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatSalesRatio(calculateSalesRatio(grossProfit, current.sales_total))}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(target?.gross_profit ?? null)}
              </TableCell>
              <TableCell className={cn('text-right font-mono font-medium', getAchievementRateColor(data.gross_profit_achievement_rate))}>
                {formatAchievementRate(data.gross_profit_achievement_rate)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(grossProfitPrev)}
              </TableCell>
              <TableCell className={cn('text-right font-mono', getYoYColor(grossProfitYoY))}>
                {formatYoY(grossProfitYoY)}
              </TableCell>
            </TableRow>

            {/* 販管費（展開可能） */}
            <TableRow
              onClick={() => toggleRow('sga')}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-1">
                  {isSGAOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <span>販管費</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(current.sga_total)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatSalesRatio(calculateSalesRatio(current.sga_total, current.sales_total))}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(target?.sga_total ?? null)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-400">
                -
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(previous_year?.sga_total ?? null)}
              </TableCell>
              <TableCell className={cn('text-right font-mono', getYoYColor(calculateYoY(current.sga_total, previous_year?.sga_total ?? null)))}>
                {formatYoY(calculateYoY(current.sga_total, previous_year?.sga_total ?? null))}
              </TableCell>
            </TableRow>

            {/* 販管費明細（展開時） */}
            {isSGAOpen && (
              sgaDetails.length > 0 ? (
                sgaDetails.map((item) => (
                  <TableRow key={item.name} className="bg-gray-50/50">
                    <TableCell className="pl-8 text-sm text-gray-600">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">
                      {formatCurrency(item.current)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      {formatSalesRatio(calculateSalesRatio(item.current, current.sales_total))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      -
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-400">
                      {formatCurrency(item.previous)}
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-sm', getYoYColor(calculateYoY(item.current, item.previous)))}>
                      {formatYoY(calculateYoY(item.current, item.previous))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="bg-gray-50/50">
                  <TableCell colSpan={7} className="text-center text-sm text-gray-400 py-2">
                    明細データがありません
                  </TableCell>
                </TableRow>
              )
            )}

            {/* 営業利益 */}
            <TableRow className="bg-gray-50 font-medium">
              <TableCell className="font-medium">営業利益</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(operatingProfit)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatSalesRatio(calculateSalesRatio(operatingProfit, current.sales_total))}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(target?.operating_profit ?? null)}
              </TableCell>
              <TableCell className={cn('text-right font-mono font-medium', getAchievementRateColor(data.operating_profit_achievement_rate))}>
                {formatAchievementRate(data.operating_profit_achievement_rate)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-500">
                {formatCurrency(operatingProfitPrev)}
              </TableCell>
              <TableCell className={cn('text-right font-mono', getYoYColor(operatingProfitYoY))}>
                {formatYoY(operatingProfitYoY)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
