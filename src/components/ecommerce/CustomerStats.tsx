/**
 * 顧客統計テーブル
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
import { useCustomerSummary } from '@/hooks/useEcommerce'
import {
  formatNumber,
  formatYoY,
  formatPercent,
  isPositiveYoY,
  getAchievementRateColor,
  formatAchievementRate,
  PeriodType,
} from '@/types/ecommerce'
import { cn } from '@/lib/utils'

interface Props {
  month: string
  periodType: PeriodType
}

export function CustomerStats({ month, periodType }: Props) {
  const { data, loading, error } = useCustomerSummary(month, periodType)

  const isCumulative = periodType === 'cumulative'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">顧客統計</CardTitle>
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
          <CardTitle className="text-lg">顧客統計</CardTitle>
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
          <CardTitle className="text-lg">顧客統計</CardTitle>
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
      label: '新規顧客',
      value: stats.new_customers,
      target: stats.new_customers_target,
      achievementRate: stats.new_customers_achievement_rate,
      previousYear: stats.new_customers_previous_year,
      twoYearsAgo: stats.new_customers_two_years_ago,
      yoy: stats.new_customers_yoy,
      yoyTwoYears: stats.new_customers_yoy_two_years,
    },
    {
      label: 'リピーター',
      value: stats.repeat_customers,
      target: stats.repeat_customers_target,
      achievementRate: stats.repeat_customers_achievement_rate,
      previousYear: stats.repeat_customers_previous_year,
      twoYearsAgo: stats.repeat_customers_two_years_ago,
      yoy: stats.repeat_customers_yoy,
      yoyTwoYears: stats.repeat_customers_yoy_two_years,
    },
    {
      label: '合計顧客数',
      value: stats.total_customers,
      target: stats.total_customers_target,
      achievementRate: stats.total_customers_achievement_rate,
      previousYear: stats.total_customers_previous_year,
      twoYearsAgo: stats.total_customers_two_years_ago,
      yoy: null,
      yoyTwoYears: null,
    },
  ]

  // 列数を計算
  const colSpan = isCumulative ? 7 : 5  // 実績,目標,達成率,前年,[前々年],前年比,[前々年比]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">顧客統計</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead
                  rowSpan={2}
                  className="bg-white border-r-2 border-gray-300 align-bottom w-[100px] min-w-[80px]"
                >
                  <div className="py-1">項目</div>
                </TableHead>
                <TableHead
                  colSpan={colSpan}
                  className="text-center bg-blue-50 text-blue-800 font-bold py-1"
                >
                  顧客数
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[80px]">実績</TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[80px]">目標</TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[60px]">達成率</TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[80px]">前年</TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[80px]">前々年</TableHead>
                )}
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[60px]">
                  前年比
                </TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[60px]">
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
                    {row.value != null ? `${formatNumber(row.value)}人` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {row.target != null ? `${formatNumber(row.target)}人` : '-'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono font-medium py-1.5 px-2",
                    getAchievementRateColor(row.achievementRate)
                  )}>
                    {formatAchievementRate(row.achievementRate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {row.previousYear != null ? `${formatNumber(row.previousYear)}人` : '-'}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                      {row.twoYearsAgo != null ? `${formatNumber(row.twoYearsAgo)}人` : '-'}
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
              {/* リピート率 */}
              <TableRow className="bg-gray-50 border-t-2 border-gray-300">
                <TableCell className="bg-gray-50 border-r-2 border-gray-300 font-medium py-1.5 px-2">
                  リピート率
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-green-600 py-1.5 px-2">
                  {stats.repeat_rate != null ? formatPercent(stats.repeat_rate) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                  -
                </TableCell>
                <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                  -
                </TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                  {stats.repeat_rate_previous_year != null ? formatPercent(stats.repeat_rate_previous_year) : '-'}
                </TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                    -
                  </TableCell>
                )}
                <TableCell className="text-right font-mono py-1.5 px-2">
                  -
                </TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono py-1.5 px-2">
                    -
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
