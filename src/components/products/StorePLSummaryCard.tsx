/**
 * 店舗収支サマリーカード
 * 店舗詳細ページ用のP/L表示（販管費展開可能）
 */
'use client'

import { useState } from 'react'
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
import { useStorePL } from '@/hooks/useFinancial'
import type { StorePLSGADetail } from '@/types/financial'

interface Props {
  segmentId: string
  month: string
}

// 数値に変換（文字列対応）
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
}

// 数値フォーマット（カンマ区切り＋円）
function formatCurrency(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return `¥${Math.round(num).toLocaleString('ja-JP')}`
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

// 明細行の型
interface SGADetailItem {
  name: string
  value: number
}

export function StorePLSummaryCard({ segmentId, month }: Props) {
  const { data, loading, error } = useStorePL(segmentId, month)
  const [sgaExpanded, setSgaExpanded] = useState(false)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">収支実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">収支実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-400">
            収支データの取得に失敗しました
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">収支実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-400">
            収支データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  // 販管費明細を取得
  const getSGADetails = (detail: StorePLSGADetail | null): SGADetailItem[] => {
    if (!detail) return []

    return [
      { name: '人件費', value: detail.personnel_cost },
      { name: '地代家賃', value: detail.land_rent },
      { name: '賃借料', value: detail.lease_cost },
      { name: '水道光熱費', value: detail.utilities },
      { name: 'その他', value: detail.others },
    ].filter(item => item.value !== 0)
  }

  const sgaDetails = getSGADetails(data.sga_detail)
  const hasDetails = sgaDetails.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">収支実績</CardTitle>
        <p className="text-sm text-gray-500">{month.substring(0, 7)}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">項目</TableHead>
              <TableHead className="text-right">今期</TableHead>
              <TableHead className="text-right">前年比</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 売上高 */}
            <TableRow>
              <TableCell className="font-medium">売上高</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.sales)}
              </TableCell>
              <TableCell className={cn('text-right font-mono', getYoYColor(data.sales_yoy_rate))}>
                {formatYoY(data.sales_yoy_rate)}
              </TableCell>
            </TableRow>

            {/* 売上原価 */}
            <TableRow>
              <TableCell className="font-medium">売上原価</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.cost_of_sales)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-400">-</TableCell>
            </TableRow>

            {/* 売上総利益 */}
            <TableRow className="bg-gray-50">
              <TableCell className="font-medium">売上総利益</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.gross_profit)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-400">-</TableCell>
            </TableRow>

            {/* 販管費（展開可能） */}
            <TableRow
              onClick={() => hasDetails && setSgaExpanded(!sgaExpanded)}
              className={cn(
                hasDetails && 'cursor-pointer hover:bg-gray-50'
              )}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-1">
                  {hasDetails ? (
                    sgaExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )
                  ) : (
                    <span className="w-4" />
                  )}
                  <span>販管費</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(data.sga_total)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-400">-</TableCell>
            </TableRow>

            {/* 販管費明細（展開時） */}
            {sgaExpanded && sgaDetails.map((item) => (
              <TableRow key={item.name} className="bg-gray-50/50">
                <TableCell className="pl-8 text-sm text-gray-600">{item.name}</TableCell>
                <TableCell className="text-right font-mono text-sm text-gray-600">
                  {formatCurrency(item.value)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}

            {/* 営業利益 */}
            <TableRow className="bg-gray-50 font-medium">
              <TableCell className="font-medium">営業利益</TableCell>
              <TableCell className="text-right font-mono font-medium">
                {formatCurrency(data.operating_profit)}
              </TableCell>
              <TableCell className={cn('text-right font-mono', getYoYColor(data.operating_profit_yoy_rate))}>
                {formatYoY(data.operating_profit_yoy_rate)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
