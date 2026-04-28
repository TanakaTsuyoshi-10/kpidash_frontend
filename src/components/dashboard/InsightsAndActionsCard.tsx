/**
 * 注目ポイントカード
 * 好調(緑)/注意(黄)/要対応(赤)のリスト。各行に詳細リンク
 */
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InsightsResponse } from '@/types/dashboard'

interface Props {
  insights: InsightsResponse | null
  loading?: boolean
}

const severityConfig = {
  good: {
    icon: CheckCircle2,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    iconColor: 'text-green-500',
    label: '好調',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    iconColor: 'text-yellow-500',
    label: '注意',
  },
  critical: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconColor: 'text-red-500',
    label: '要対応',
  },
}

export function InsightsAndActionsCard({ insights, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!insights || insights.items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-base font-semibold">注目ポイント</CardTitle>
          <span className="ml-auto text-xs text-gray-400">{insights.period}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.items.map((item, index) => {
          const config = severityConfig[item.severity] || severityConfig.warning
          const Icon = config.icon

          const content = (
            <div
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                config.bg,
                config.border,
                item.link && 'hover:opacity-80 cursor-pointer',
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', config.iconColor)} />
              <span className={cn('text-sm flex-1', config.text)}>
                {item.text}
              </span>
              {item.link && (
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
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
