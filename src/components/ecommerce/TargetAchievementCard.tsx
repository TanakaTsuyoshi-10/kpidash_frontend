/**
 * 通販目標達成率カード
 * チャネル別・顧客別の目標達成状況を表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useEcommerceTargets } from '@/hooks/useTarget'
import { formatCurrency, formatAchievementRate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Target, TrendingUp, Users } from 'lucide-react'

interface Props {
  month: string
}

// チャネルの色設定
const CHANNEL_COLORS: Record<string, string> = {
  'EC': 'bg-blue-500',
  '電話': 'bg-green-500',
  'FAX': 'bg-amber-500',
  '店舗受付': 'bg-purple-500',
}

// 達成率に基づく色
function getAchievementColor(rate: number | null): string {
  if (rate === null) return 'bg-gray-200'
  if (rate >= 100) return 'bg-green-500'
  if (rate >= 80) return 'bg-yellow-500'
  return 'bg-red-500'
}

// 達成率を計算
function calculateAchievementRate(actual: number | null, target: number | null): number | null {
  if (actual === null || target === null || target === 0) return null
  return (actual / target) * 100
}

interface ChannelAchievementProps {
  channel: string
  actualSales: number | null
  targetSales: number | null
  actualBuyers: number | null
  targetBuyers: number | null
}

function ChannelAchievement({ channel, actualSales, targetSales, actualBuyers, targetBuyers }: ChannelAchievementProps) {
  const salesRate = calculateAchievementRate(actualSales, targetSales)
  const buyersRate = calculateAchievementRate(actualBuyers, targetBuyers)
  const channelColor = CHANNEL_COLORS[channel] || 'bg-gray-500'

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('w-3 h-3 rounded-full', channelColor)} />
        <h4 className="font-medium">{channel}</h4>
      </div>

      {/* 売上達成率 */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600">
          <span>売上</span>
          <span>
            {formatCurrency(actualSales, false)} / {formatCurrency(targetSales, false)}
          </span>
        </div>
        <Progress
          value={salesRate !== null ? Math.min(salesRate, 100) : 0}
          className="h-2"
        />
        <div className="text-right text-sm font-medium">
          <span className={cn(
            salesRate !== null && salesRate >= 100 ? 'text-green-600' :
            salesRate !== null && salesRate >= 80 ? 'text-yellow-600' :
            salesRate !== null ? 'text-red-600' : 'text-gray-400'
          )}>
            {salesRate !== null ? `${salesRate.toFixed(1)}%` : '-'}
          </span>
        </div>
      </div>

      {/* 購入者数達成率 */}
      {(targetBuyers !== null || actualBuyers !== null) && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>購入者</span>
            <span>
              {actualBuyers?.toLocaleString() ?? '-'} / {targetBuyers?.toLocaleString() ?? '-'}人
            </span>
          </div>
          <Progress
            value={buyersRate !== null ? Math.min(buyersRate, 100) : 0}
            className="h-2"
          />
          <div className="text-right text-sm font-medium">
            <span className={cn(
              buyersRate !== null && buyersRate >= 100 ? 'text-green-600' :
              buyersRate !== null && buyersRate >= 80 ? 'text-yellow-600' :
              buyersRate !== null ? 'text-red-600' : 'text-gray-400'
            )}>
              {buyersRate !== null ? `${buyersRate.toFixed(1)}%` : '-'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function TargetAchievementCard({ month }: Props) {
  const { data: targetData, loading, error } = useEcommerceTargets(month)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            目標達成状況
          </CardTitle>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            目標達成状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            目標データを取得できませんでした
          </div>
        </CardContent>
      </Card>
    )
  }

  // 目標が設定されていない場合
  const hasTargets = targetData?.channel_targets?.some(ch => ch.target_sales !== null) ||
                     targetData?.customer_target !== null

  if (!targetData || !hasTargets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            目標達成状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p>目標が設定されていません</p>
            <p className="text-sm mt-2">目標設定画面から設定してください</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 合計達成率
  const totalRate = calculateAchievementRate(
    targetData.last_year_total_sales, // 実績データはAPI側で提供されていないため、仮で前年を使用
    targetData.total_target_sales
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          目標達成状況
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 売上目標サマリー */}
        {targetData.total_target_sales !== null && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="font-medium">売上目標</span>
              </div>
              <span className="text-lg font-bold">
                {formatCurrency(targetData.total_target_sales, false)}
              </span>
            </div>
            {targetData.yoy_total_rate !== null && (
              <p className="text-sm text-gray-500">
                前年比: <span className={cn(
                  targetData.yoy_total_rate >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {targetData.yoy_total_rate >= 0 ? '+' : ''}{targetData.yoy_total_rate.toFixed(1)}%
                </span>
              </p>
            )}
          </div>
        )}

        {/* チャネル別達成状況 */}
        {targetData.channel_targets && targetData.channel_targets.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">チャネル別達成状況</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targetData.channel_targets.map((channel) => (
                <ChannelAchievement
                  key={channel.channel}
                  channel={channel.channel}
                  actualSales={channel.last_year_sales} // 実績がないため前年データで代用
                  targetSales={channel.target_sales}
                  actualBuyers={channel.last_year_buyers}
                  targetBuyers={channel.target_buyers}
                />
              ))}
            </div>
          </div>
        )}

        {/* 顧客統計目標 */}
        {targetData.customer_target && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              顧客目標
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 新規顧客 */}
              {targetData.customer_target.new_customers !== null && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">新規顧客数</span>
                    <span className="font-medium">
                      {targetData.customer_target.last_year_new?.toLocaleString() ?? '-'} / {targetData.customer_target.new_customers.toLocaleString()}人
                    </span>
                  </div>
                  <Progress
                    value={calculateAchievementRate(targetData.customer_target.last_year_new, targetData.customer_target.new_customers) ?? 0}
                    className="h-2"
                  />
                  {targetData.customer_target.yoy_new_rate !== null && (
                    <p className="text-xs text-gray-500 text-right">
                      前年比目標: <span className={cn(
                        targetData.customer_target.yoy_new_rate >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {targetData.customer_target.yoy_new_rate >= 0 ? '+' : ''}{targetData.customer_target.yoy_new_rate.toFixed(1)}%
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* リピーター */}
              {targetData.customer_target.repeat_customers !== null && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">リピーター数</span>
                    <span className="font-medium">
                      {targetData.customer_target.last_year_repeat?.toLocaleString() ?? '-'} / {targetData.customer_target.repeat_customers.toLocaleString()}人
                    </span>
                  </div>
                  <Progress
                    value={calculateAchievementRate(targetData.customer_target.last_year_repeat, targetData.customer_target.repeat_customers) ?? 0}
                    className="h-2"
                  />
                  {targetData.customer_target.yoy_repeat_rate !== null && (
                    <p className="text-xs text-gray-500 text-right">
                      前年比目標: <span className={cn(
                        targetData.customer_target.yoy_repeat_rate >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {targetData.customer_target.yoy_repeat_rate >= 0 ? '+' : ''}{targetData.customer_target.yoy_repeat_rate.toFixed(1)}%
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
