/**
 * 通販サマリーカード
 * 4ミニカード横並び（EC売上/ふるさと納税/新規顧客数/HP PV）各YoYバッジ付き
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ShoppingCart,
  Heart,
  UserPlus,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber } from '@/lib/format'
import type { ChannelSummaryResponse } from '@/types/ecommerce'
import type { CustomerSummaryResponse, WebsiteStatsResponse } from '@/types/ecommerce'

interface Props {
  channelData: ChannelSummaryResponse | null
  customerData: CustomerSummaryResponse | null
  websiteData: WebsiteStatsResponse | null
  loading?: boolean
}

interface MiniCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: string
  yoy: number | null
}

function MiniCard({ icon: Icon, title, value, yoy }: MiniCardProps) {
  const isPositive = yoy !== null && yoy > 0
  const isNegative = yoy !== null && yoy < 0
  const YoYIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const yoyColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
  const sign = isPositive ? '+' : ''

  return (
    <Card className="h-full">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-500 truncate">{title}</span>
        </div>
        <div className="text-lg font-bold">{value}</div>
        {yoy !== null ? (
          <div className={cn('mt-1 flex items-center gap-0.5 text-xs', yoyColor)}>
            <YoYIcon className="h-3 w-3" />
            <span>{sign}{yoy.toFixed(1)}%</span>
          </div>
        ) : (
          <div className="mt-1 text-xs text-gray-400">-</div>
        )}
      </CardContent>
    </Card>
  )
}

export function EcommerceSummaryCard({ channelData, customerData, websiteData, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-20 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // EC売上
  const ecChannel = channelData?.channels?.find(c => c.channel === 'EC')
  const ecSales = ecChannel?.sales ?? channelData?.totals?.sales ?? null
  const ecYoy = ecChannel ? (ecChannel.sales_yoy ? ecChannel.sales_yoy - 100 : null) : (channelData?.totals?.sales_yoy ? channelData.totals.sales_yoy - 100 : null)

  // ふるさと納税
  const furusatoChannel = channelData?.channels?.find(c => c.channel === 'ふるさと納税')
  const furusatoSales = furusatoChannel?.sales ?? null
  const furusatoYoy = furusatoChannel?.sales_yoy ? furusatoChannel.sales_yoy - 100 : null

  // 新規顧客数
  const newCustomers = customerData?.data?.new_customers ?? null
  const newCustomersYoy = customerData?.data?.new_customers_yoy ? customerData.data.new_customers_yoy - 100 : null

  // HP PV
  const pageViews = websiteData?.data?.page_views ?? null
  const pvYoy = websiteData?.data?.page_views_yoy ? websiteData.data.page_views_yoy - 100 : null

  // 全てnullならセクション非表示
  if (ecSales === null && furusatoSales === null && newCustomers === null && pageViews === null) {
    return null
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="h-4 w-4 text-green-600" />
        <h2 className="text-base font-semibold">通販サマリー</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniCard
          icon={ShoppingCart}
          title="通販売上"
          value={formatCurrency(ecSales ?? channelData?.totals?.sales)}
          yoy={ecYoy ?? (channelData?.totals?.sales_yoy ? channelData.totals.sales_yoy - 100 : null)}
        />
        <MiniCard
          icon={Heart}
          title="ふるさと納税"
          value={formatCurrency(furusatoSales)}
          yoy={furusatoYoy}
        />
        <MiniCard
          icon={UserPlus}
          title="新規顧客数"
          value={newCustomers !== null ? formatNumber(newCustomers, '人') : '-'}
          yoy={newCustomersYoy}
        />
        <MiniCard
          icon={Globe}
          title="HP PV"
          value={pageViews !== null ? formatNumber(pageViews) : '-'}
          yoy={pvYoy}
        />
      </div>
    </div>
  )
}
