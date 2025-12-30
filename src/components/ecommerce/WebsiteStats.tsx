/**
 * HPアクセス数テーブル
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
import { useWebsiteStats } from '@/hooks/useEcommerce'
import {
  formatNumber,
  formatYoY,
  isPositiveYoY,
  PeriodType,
} from '@/types/ecommerce'
import { cn } from '@/lib/utils'

interface Props {
  month: string
  periodType: PeriodType
}

export function WebsiteStats({ month, periodType }: Props) {
  const { data, loading, error } = useWebsiteStats(month, periodType)

  const isCumulative = periodType === 'cumulative'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">HPアクセス数</CardTitle>
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
        <CardHeader>
          <CardTitle className="text-lg">HPアクセス数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">HPアクセス数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">データがありません</div>
        </CardContent>
      </Card>
    )
  }

  const stats = data.data

  const rows = [
    {
      label: 'ページビュー',
      value: stats.page_views,
      previousYear: stats.page_views_previous_year,
      twoYearsAgo: stats.page_views_two_years_ago,
      yoy: stats.page_views_yoy,
      yoyTwoYears: stats.page_views_yoy_two_years,
    },
    {
      label: 'ユニークビジター',
      value: stats.unique_visitors,
      previousYear: stats.unique_visitors_previous_year,
      twoYearsAgo: stats.unique_visitors_two_years_ago,
      yoy: stats.unique_visitors_yoy,
      yoyTwoYears: stats.unique_visitors_yoy_two_years,
    },
    {
      label: 'セッション',
      value: stats.sessions,
      previousYear: stats.sessions_previous_year,
      twoYearsAgo: stats.sessions_two_years_ago,
      yoy: stats.sessions_yoy,
      yoyTwoYears: stats.sessions_yoy_two_years,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">HPアクセス数</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead
                  rowSpan={2}
                  className="bg-white border-r-2 border-gray-300 align-bottom w-[120px] min-w-[100px]"
                >
                  <div className="py-1">項目</div>
                </TableHead>
                <TableHead
                  colSpan={isCumulative ? 5 : 3}
                  className="text-center bg-purple-50 text-purple-800 font-bold py-1"
                >
                  アクセス数
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-right bg-purple-50/50 py-1 px-3 w-[100px]">実績</TableHead>
                <TableHead className="text-right bg-purple-50/50 py-1 px-3 w-[100px]">前年</TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-purple-50/50 py-1 px-3 w-[100px]">前々年</TableHead>
                )}
                <TableHead className={cn(
                  "text-right bg-purple-50/50 py-1 px-3 w-[80px]",
                  !isCumulative && ""
                )}>
                  前年比
                </TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-purple-50/50 py-1 px-3 w-[80px]">
                    前々年比
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} className="hover:bg-gray-50">
                  <TableCell className="bg-white border-r-2 border-gray-300 font-medium py-1.5 px-2">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-right font-mono py-1.5 px-2">
                    {row.value != null ? formatNumber(row.value) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {row.previousYear != null ? formatNumber(row.previousYear) : '-'}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                      {row.twoYearsAgo != null ? formatNumber(row.twoYearsAgo) : '-'}
                    </TableCell>
                  )}
                  <TableCell className={cn(
                    "text-right font-mono py-1.5 px-2",
                    row.yoy != null && (isPositiveYoY(row.yoy) ? 'text-green-600' : 'text-red-600')
                  )}>
                    {row.yoy != null ? formatYoY(row.yoy) : '-'}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className={cn(
                      "text-right font-mono py-1.5 px-2",
                      row.yoyTwoYears != null && (isPositiveYoY(row.yoyTwoYears) ? 'text-green-600' : 'text-red-600')
                    )}>
                      {row.yoyTwoYears != null ? formatYoY(row.yoyTwoYears) : '-'}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
