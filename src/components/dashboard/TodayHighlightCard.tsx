/**
 * 今日のハイライトカード
 * カレンダーアイコン付きテキスト洞察3〜4件。各行タップで詳細ページへ遷移
 */
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  TrendingUp,
  Trophy,
  ShoppingCart,
  AlertTriangle,
  Users,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HighlightResponse } from '@/types/dashboard'

interface Props {
  highlights: HighlightResponse | null
  loading?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Trophy,
  ShoppingCart,
  AlertTriangle,
  Users,
  Target,
  Calendar,
}

const severityStyles: Record<string, { bg: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-800', icon: 'text-blue-500' },
  good: { bg: 'bg-green-50', text: 'text-green-800', icon: 'text-green-500' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-800', icon: 'text-yellow-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-800', icon: 'text-red-500' },
}

export function TodayHighlightCard({ highlights, loading }: Props) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader className="pb-2">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-white/60 rounded-lg animate-pulse" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!highlights || highlights.items.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          <CardTitle className="text-base font-semibold text-green-800">
            今日のハイライト
          </CardTitle>
          {highlights.data_freshness && (
            <span className="ml-auto text-xs text-gray-500">
              更新: {highlights.data_freshness}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {highlights.items.map((item, index) => {
          const Icon = iconMap[item.icon] || Calendar
          const style = severityStyles[item.severity] || severityStyles.info

          const content = (
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                style.bg,
                item.link && 'hover:opacity-80 cursor-pointer'
              )}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', style.icon)} />
              <span className={cn('text-sm font-medium', style.text)}>
                {item.text}
              </span>
            </div>
          )

          if (item.link) {
            return (
              <Link key={index} href={item.link}>
                {content}
              </Link>
            )
          }

          return <div key={index}>{content}</div>
        })}
      </CardContent>
    </Card>
  )
}
