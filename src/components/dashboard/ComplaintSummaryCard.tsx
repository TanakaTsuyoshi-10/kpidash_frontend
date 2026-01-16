/**
 * クレームサマリーカード
 * ダッシュボードに表示するクレーム概要
 */
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComplaintSummary } from '@/types/dashboard'

interface Props {
  summary: ComplaintSummary | null | undefined
  loading?: boolean
}

export function ComplaintSummaryCard({ summary, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            クレーム
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            クレーム
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-400 text-center py-4">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  // 前月比（差分）
  const monthDiff = summary.current_month_count - summary.previous_month_count
  const monthDiffSign = monthDiff > 0 ? '+' : monthDiff < 0 ? '' : '±'

  // 前年比の表示
  const yoyRate = summary.yoy_rate
  const hasYoY = yoyRate !== null && yoyRate !== undefined

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          クレーム
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 今月件数 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">今月件数</span>
          <Link
            href="/manufacturing/complaints"
            className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline"
          >
            {summary.current_month_count}件
          </Link>
        </div>

        {/* 前月比 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">前月比</span>
          <span className={cn(
            'text-sm font-medium',
            monthDiff > 0 ? 'text-red-600' : monthDiff < 0 ? 'text-green-600' : 'text-gray-500'
          )}>
            {monthDiffSign}{monthDiff}件
          </span>
        </div>

        {/* 前年比 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">前年比</span>
          {hasYoY ? (
            <span className={cn(
              'text-sm font-medium flex items-center gap-1',
              yoyRate! < 0 ? 'text-green-600' : yoyRate! > 0 ? 'text-red-600' : 'text-gray-500'
            )}>
              {yoyRate! > 0 ? '+' : ''}{yoyRate!.toFixed(1)}%
              {yoyRate! < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : yoyRate! > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : null}
            </span>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </div>

        {/* 対応中 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">対応中</span>
          <span className={cn(
            'text-sm font-medium',
            summary.in_progress_count > 0 ? 'text-amber-600' : 'text-gray-500'
          )}>
            {summary.in_progress_count}件
          </span>
        </div>

        {/* 詳細リンク */}
        <div className="pt-2">
          <Link href="/manufacturing/complaints">
            <Button variant="outline" size="sm" className="w-full">
              詳細を見る
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
