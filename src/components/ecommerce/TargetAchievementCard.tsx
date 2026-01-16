/**
 * 通販目標達成率カード
 * チャネル別・顧客別の目標達成状況を表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useEcommerceTargets } from '@/hooks/useTarget'
import { useChannelSummary, useCustomerSummary } from '@/hooks/useEcommerce'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Target, TrendingUp, Users } from 'lucide-react'
import type { ChannelData, CustomerStatsData } from '@/types/ecommerce'

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
  channelData: ChannelData
}

function ChannelAchievement({ channelData }: ChannelAchievementProps) {
  const {
    channel,
    sales,
    sales_target,
    sales_achievement_rate,
    buyers,
    buyers_target,
    buyers_achievement_rate
  } = channelData

  // 達成率はAPIから取得、なければ計算
  const salesRate = sales_achievement_rate ?? calculateAchievementRate(sales, sales_target)
  const buyersRate = buyers_achievement_rate ?? calculateAchievementRate(buyers, buyers_target)
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
            {formatCurrency(sales, false)} / {formatCurrency(sales_target, false)}
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
      {(buyers_target !== null || buyers !== null) && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>購入者</span>
            <span>
              {buyers?.toLocaleString() ?? '-'} / {buyers_target?.toLocaleString() ?? '-'}人
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
  const { data: targetData, loading: targetLoading, error: targetError } = useEcommerceTargets(month)
  const { data: channelData, loading: channelLoading, error: channelError } = useChannelSummary(month, 'monthly')
  const { data: customerData, loading: customerLoading, error: customerError } = useCustomerSummary(month, 'monthly')

  const loading = targetLoading || channelLoading || customerLoading
  const error = targetError || channelError || customerError

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

  // 実績データがあるか確認
  const hasChannelData = channelData?.channels && channelData.channels.length > 0
  const hasCustomerData = customerData?.data

  // 目標が設定されていない、かつ実績データもない場合
  if (!hasChannelData && !hasCustomerData) {
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
            <p>データがありません</p>
            <p className="text-sm mt-2">実績データをアップロードしてください</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 合計達成率（実績データから取得）
  const totalRate = channelData?.totals?.sales_achievement_rate ??
    calculateAchievementRate(channelData?.totals?.sales, channelData?.totals?.sales_target)

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
        {(channelData?.totals?.sales_target !== null || channelData?.totals?.sales !== null) && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="font-medium">売上合計</span>
              </div>
              <span className="text-lg font-bold">
                {formatCurrency(channelData?.totals?.sales, false)} / {formatCurrency(channelData?.totals?.sales_target, false)}
              </span>
            </div>
            {/* 達成率 */}
            <div className="space-y-1">
              <Progress
                value={totalRate !== null ? Math.min(totalRate, 100) : 0}
                className="h-2"
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">達成率</span>
                <span className={cn(
                  'font-medium',
                  totalRate !== null && totalRate >= 100 ? 'text-green-600' :
                  totalRate !== null && totalRate >= 80 ? 'text-yellow-600' :
                  totalRate !== null ? 'text-red-600' : 'text-gray-400'
                )}>
                  {totalRate !== null ? `${totalRate.toFixed(1)}%` : '-'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* チャネル別達成状況 */}
        {hasChannelData && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">チャネル別達成状況</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channelData!.channels.map((channel) => (
                <ChannelAchievement
                  key={channel.channel}
                  channelData={channel}
                />
              ))}
            </div>
          </div>
        )}

        {/* 顧客統計 */}
        {hasCustomerData && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              顧客達成状況
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 新規顧客 */}
              {(customerData!.data.new_customers !== null || customerData!.data.new_customers_target !== null) && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">新規顧客数</span>
                    <span className="font-medium">
                      {customerData!.data.new_customers?.toLocaleString() ?? '-'} / {customerData!.data.new_customers_target?.toLocaleString() ?? '-'}人
                    </span>
                  </div>
                  {(() => {
                    const rate = customerData!.data.new_customers_achievement_rate ??
                      calculateAchievementRate(customerData!.data.new_customers, customerData!.data.new_customers_target)
                    return (
                      <>
                        <Progress
                          value={rate !== null ? Math.min(rate, 100) : 0}
                          className="h-2"
                        />
                        <div className="text-right text-sm font-medium">
                          <span className={cn(
                            rate !== null && rate >= 100 ? 'text-green-600' :
                            rate !== null && rate >= 80 ? 'text-yellow-600' :
                            rate !== null ? 'text-red-600' : 'text-gray-400'
                          )}>
                            {rate !== null ? `${rate.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* リピーター */}
              {(customerData!.data.repeat_customers !== null || customerData!.data.repeat_customers_target !== null) && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">リピーター数</span>
                    <span className="font-medium">
                      {customerData!.data.repeat_customers?.toLocaleString() ?? '-'} / {customerData!.data.repeat_customers_target?.toLocaleString() ?? '-'}人
                    </span>
                  </div>
                  {(() => {
                    const rate = customerData!.data.repeat_customers_achievement_rate ??
                      calculateAchievementRate(customerData!.data.repeat_customers, customerData!.data.repeat_customers_target)
                    return (
                      <>
                        <Progress
                          value={rate !== null ? Math.min(rate, 100) : 0}
                          className="h-2"
                        />
                        <div className="text-right text-sm font-medium">
                          <span className={cn(
                            rate !== null && rate >= 100 ? 'text-green-600' :
                            rate !== null && rate >= 80 ? 'text-yellow-600' :
                            rate !== null ? 'text-red-600' : 'text-gray-400'
                          )}>
                            {rate !== null ? `${rate.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
