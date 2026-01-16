/**
 * チャネル別実績テーブル
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
import { useChannelSummary } from '@/hooks/useEcommerce'
import {
  formatCurrency,
  formatNumber,
  formatYoY,
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

// チャネルの色設定
const CHANNEL_COLORS: Record<string, { bg: string; text: string }> = {
  'EC': { bg: 'bg-blue-50', text: 'text-blue-800' },
  '電話': { bg: 'bg-green-50', text: 'text-green-800' },
  'FAX': { bg: 'bg-amber-50', text: 'text-amber-800' },
  '店舗受付': { bg: 'bg-purple-50', text: 'text-purple-800' },
}

export function ChannelSummaryTable({ month, periodType }: Props) {
  const { data, loading, error } = useChannelSummary(month, periodType)

  const isCumulative = periodType === 'cumulative'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャネル別実績</CardTitle>
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
          <CardTitle className="text-lg">チャネル別実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャネル別実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">データがありません</div>
        </CardContent>
      </Card>
    )
  }

  // 売上高の列数を計算
  const salesColSpan = isCumulative ? 7 : 5  // 実績,目標,達成率,前年,[前々年],前年比,[前々年比]
  // 購入者数の列数を計算
  const buyersColSpan = isCumulative ? 7 : 5

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">チャネル別実績</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead rowSpan={2} className="sticky left-0 z-20 bg-white border-r-2 border-gray-300 align-bottom w-[70px]">
                  <div className="py-1">チャネル</div>
                </TableHead>
                <TableHead colSpan={salesColSpan} className="text-center bg-emerald-50 text-emerald-800 font-bold border-r-2 border-gray-300 py-1">
                  売上高
                </TableHead>
                <TableHead colSpan={buyersColSpan} className="text-center bg-blue-50 text-blue-800 font-bold border-r-2 border-gray-300 py-1">
                  購入者数
                </TableHead>
                <TableHead colSpan={isCumulative ? 5 : 3} className="text-center bg-amber-50 text-amber-800 font-bold py-1">
                  客単価
                </TableHead>
              </TableRow>
              <TableRow>
                {/* 売上高 */}
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[80px]">実績</TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[80px]">目標</TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[55px]">達成率</TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[80px]">前年</TableHead>
                {isCumulative && <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[80px]">前々年</TableHead>}
                <TableHead className={cn("text-right bg-emerald-50/50 py-1 px-2 w-[55px]", !isCumulative && "border-r-2 border-gray-300")}>前年比</TableHead>
                {isCumulative && <TableHead className="text-right bg-emerald-50/50 py-1 px-2 w-[55px] border-r-2 border-gray-300">前々年比</TableHead>}
                {/* 購入者数 */}
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[55px]">実績</TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[55px]">目標</TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[55px]">達成率</TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[55px]">前年</TableHead>
                {isCumulative && <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[55px]">前々年</TableHead>}
                <TableHead className={cn("text-right bg-blue-50/50 py-1 px-2 w-[55px]", !isCumulative && "border-r-2 border-gray-300")}>前年比</TableHead>
                {isCumulative && <TableHead className="text-right bg-blue-50/50 py-1 px-2 w-[55px] border-r-2 border-gray-300">前々年比</TableHead>}
                {/* 客単価 */}
                <TableHead className="text-right bg-amber-50/50 py-1 px-2 w-[70px]">実績</TableHead>
                <TableHead className="text-right bg-amber-50/50 py-1 px-2 w-[70px]">前年</TableHead>
                {isCumulative && <TableHead className="text-right bg-amber-50/50 py-1 px-2 w-[70px]">前々年</TableHead>}
                <TableHead className="text-right bg-amber-50/50 py-1 px-2 w-[55px]">前年比</TableHead>
                {isCumulative && <TableHead className="text-right bg-amber-50/50 py-1 px-2 w-[55px]">前々年比</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.channels.map((channel) => {
                const color = CHANNEL_COLORS[channel.channel] || { bg: 'bg-gray-50', text: 'text-gray-800' }
                return (
                  <TableRow key={channel.channel} className="hover:bg-gray-50">
                    <TableCell className={cn("sticky left-0 z-10 border-r-2 border-gray-300 font-medium py-1.5 px-2 w-[70px]", color.bg, color.text)}>
                      {channel.channel}
                    </TableCell>
                    {/* 売上高 */}
                    <TableCell className="text-right font-mono py-1.5 px-2">{formatCurrency(channel.sales)}</TableCell>
                    <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatCurrency(channel.sales_target)}</TableCell>
                    <TableCell className={cn("text-right font-mono font-medium py-1.5 px-2", getAchievementRateColor(channel.sales_achievement_rate))}>
                      {formatAchievementRate(channel.sales_achievement_rate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatCurrency(channel.sales_previous_year)}</TableCell>
                    {isCumulative && <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">{formatCurrency(channel.sales_two_years_ago)}</TableCell>}
                    <TableCell className={cn("text-right font-mono py-1.5 px-2", !isCumulative && "border-r-2 border-gray-300", isPositiveYoY(channel.sales_yoy) ? 'text-green-600' : 'text-red-600')}>
                      {formatYoY(channel.sales_yoy)}
                    </TableCell>
                    {isCumulative && (
                      <TableCell className={cn("text-right font-mono py-1.5 px-2 border-r-2 border-gray-300", isPositiveYoY(channel.sales_yoy_two_years) ? 'text-green-600' : 'text-red-600')}>
                        {formatYoY(channel.sales_yoy_two_years)}
                      </TableCell>
                    )}
                    {/* 購入者数 */}
                    <TableCell className="text-right font-mono py-1.5 px-2">{formatNumber(channel.buyers)}</TableCell>
                    <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatNumber(channel.buyers_target)}</TableCell>
                    <TableCell className={cn("text-right font-mono font-medium py-1.5 px-2", getAchievementRateColor(channel.buyers_achievement_rate))}>
                      {formatAchievementRate(channel.buyers_achievement_rate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatNumber(channel.buyers_previous_year)}</TableCell>
                    {isCumulative && <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">{formatNumber(channel.buyers_two_years_ago)}</TableCell>}
                    <TableCell className={cn("text-right font-mono py-1.5 px-2", !isCumulative && "border-r-2 border-gray-300", isPositiveYoY(channel.buyers_yoy) ? 'text-green-600' : 'text-red-600')}>
                      {formatYoY(channel.buyers_yoy)}
                    </TableCell>
                    {isCumulative && (
                      <TableCell className={cn("text-right font-mono py-1.5 px-2 border-r-2 border-gray-300", isPositiveYoY(channel.buyers_yoy_two_years) ? 'text-green-600' : 'text-red-600')}>
                        {formatYoY(channel.buyers_yoy_two_years)}
                      </TableCell>
                    )}
                    {/* 客単価 */}
                    <TableCell className="text-right font-mono py-1.5 px-2">{formatCurrency(channel.unit_price)}</TableCell>
                    <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatCurrency(channel.unit_price_previous_year)}</TableCell>
                    {isCumulative && <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">{formatCurrency(channel.unit_price_two_years_ago)}</TableCell>}
                    <TableCell className={cn("text-right font-mono py-1.5 px-2", isPositiveYoY(channel.unit_price_yoy) ? 'text-green-600' : 'text-red-600')}>
                      {formatYoY(channel.unit_price_yoy)}
                    </TableCell>
                    {isCumulative && (
                      <TableCell className={cn("text-right font-mono py-1.5 px-2", isPositiveYoY(channel.unit_price_yoy_two_years) ? 'text-green-600' : 'text-red-600')}>
                        {formatYoY(channel.unit_price_yoy_two_years)}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {/* 合計行 */}
              <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-400">
                <TableCell className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 py-1.5 px-2 w-[70px]">合計</TableCell>
                {/* 売上高 */}
                <TableCell className="text-right font-mono py-1.5 px-2">{formatCurrency(data.totals.sales)}</TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatCurrency(data.totals.sales_target)}</TableCell>
                <TableCell className={cn("text-right font-mono font-medium py-1.5 px-2", getAchievementRateColor(data.totals.sales_achievement_rate))}>
                  {formatAchievementRate(data.totals.sales_achievement_rate)}
                </TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatCurrency(data.totals.sales_previous_year)}</TableCell>
                {isCumulative && <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">{formatCurrency(data.totals.sales_two_years_ago)}</TableCell>}
                <TableCell className={cn("text-right font-mono py-1.5 px-2", !isCumulative && "border-r-2 border-gray-300", isPositiveYoY(data.totals.sales_yoy) ? 'text-green-600' : 'text-red-600')}>
                  {formatYoY(data.totals.sales_yoy)}
                </TableCell>
                {isCumulative && (
                  <TableCell className={cn("text-right font-mono py-1.5 px-2 border-r-2 border-gray-300", isPositiveYoY(data.totals.sales_yoy_two_years) ? 'text-green-600' : 'text-red-600')}>
                    {formatYoY(data.totals.sales_yoy_two_years)}
                  </TableCell>
                )}
                {/* 購入者数 */}
                <TableCell className="text-right font-mono py-1.5 px-2">{formatNumber(data.totals.buyers)}</TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatNumber(data.totals.buyers_target)}</TableCell>
                <TableCell className={cn("text-right font-mono font-medium py-1.5 px-2", getAchievementRateColor(data.totals.buyers_achievement_rate))}>
                  {formatAchievementRate(data.totals.buyers_achievement_rate)}
                </TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatNumber(data.totals.buyers_previous_year)}</TableCell>
                {isCumulative && <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">{formatNumber(data.totals.buyers_two_years_ago)}</TableCell>}
                <TableCell className={cn("text-right font-mono py-1.5 px-2", !isCumulative && "border-r-2 border-gray-300", isPositiveYoY(data.totals.buyers_yoy) ? 'text-green-600' : 'text-red-600')}>
                  {formatYoY(data.totals.buyers_yoy)}
                </TableCell>
                {isCumulative && (
                  <TableCell className={cn("text-right font-mono py-1.5 px-2 border-r-2 border-gray-300", isPositiveYoY(data.totals.buyers_yoy_two_years) ? 'text-green-600' : 'text-red-600')}>
                    {formatYoY(data.totals.buyers_yoy_two_years)}
                  </TableCell>
                )}
                {/* 客単価 */}
                <TableCell className="text-right font-mono py-1.5 px-2">{formatCurrency(data.totals.unit_price)}</TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">{formatCurrency(data.totals.unit_price_previous_year)}</TableCell>
                {isCumulative && <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">{formatCurrency(data.totals.unit_price_two_years_ago)}</TableCell>}
                <TableCell className={cn("text-right font-mono py-1.5 px-2", isPositiveYoY(data.totals.unit_price_yoy) ? 'text-green-600' : 'text-red-600')}>
                  {formatYoY(data.totals.unit_price_yoy)}
                </TableCell>
                {isCumulative && (
                  <TableCell className={cn("text-right font-mono py-1.5 px-2", isPositiveYoY(data.totals.unit_price_yoy_two_years) ? 'text-green-600' : 'text-red-600')}>
                    {formatYoY(data.totals.unit_price_yoy_two_years)}
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
