/**
 * 製造分析メインコンテナ
 * 全セクションを統合表示
 */
'use client'

import { useState } from 'react'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { ManufacturingSummaryCards } from './ManufacturingSummaryCards'
import { ManufacturingComparisonTable } from './ManufacturingComparisonTable'
import { ProductionChart } from './ProductionChart'
import { ProductivityChart } from './ProductivityChart'
import { DailyDataTable } from './DailyDataTable'
import { ManufacturingUploadDialog } from './ManufacturingUploadDialog'
import { MonthlyCommentCard } from '@/components/dashboard/MonthlyCommentCard'
import { useManufacturingAnalysis } from '@/hooks/useManufacturing'
import { Button } from '@/components/ui/button'
import { RefreshCw, Upload } from 'lucide-react'
import { formatPeriod, formatDisplayPeriod } from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

interface Props {
  periodType: PeriodType
  year: number
  month: number
  quarter: number
  onPeriodTypeChange: (type: PeriodType) => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onQuarterChange: (quarter: number) => void
}

export function ManufacturingAnalysisContainer({
  periodType,
  year,
  month,
  quarter,
  onPeriodTypeChange,
  onYearChange,
  onMonthChange,
  onQuarterChange,
}: Props) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // コメント用の期間文字列（YYYY-MM-01形式）
  // 年度からカレンダー年に変換（例: 2025年度9月 → 2024-09-01）
  const commentPeriod = formatPeriod(year, month)

  // 製造分析データ取得
  const { data, loading, error, refetch } = useManufacturingAnalysis({
    period_type: periodType,
    year,
    month: periodType === 'monthly' ? month : undefined,
    quarter: periodType === 'quarterly' ? quarter : undefined,
  })

  // アップロード成功時の処理
  const handleUploadSuccess = () => {
    refetch()
  }

  // エラー表示
  if (error) {
    return (
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">製造分析</h1>
          <div className="flex items-center gap-3">
            <PeriodSelector
              periodType={periodType}
              year={year}
              month={month}
              quarter={quarter}
              onPeriodTypeChange={onPeriodTypeChange}
              onYearChange={onYearChange}
              onMonthChange={onMonthChange}
              onQuarterChange={onQuarterChange}
            />
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              アップロード
            </Button>
          </div>
        </div>

        {/* エラーメッセージ */}
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </div>

        <ManufacturingUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          year={year}
          month={month}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">製造分析</h1>
          <p className="text-sm text-gray-600 mt-1">
            {formatDisplayPeriod(year, month)} | {year}年度
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            periodType={periodType}
            year={year}
            month={month}
            quarter={quarter}
            onPeriodTypeChange={onPeriodTypeChange}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
            onQuarterChange={onQuarterChange}
          />
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            アップロード
          </Button>
          <Button onClick={refetch} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 月次サマリー */}
      <section>
        <ManufacturingSummaryCards
          summary={data?.summary ?? null}
          loading={loading}
        />
      </section>

      {/* 前年比較 */}
      <section>
        <ManufacturingComparisonTable
          comparison={data?.comparison ?? null}
          loading={loading}
        />
      </section>

      {/* グラフ（2カラム） */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductionChart
          data={data?.chart_data ?? []}
          loading={loading}
        />
        <ProductivityChart
          data={data?.chart_data ?? []}
          loading={loading}
        />
      </section>

      {/* 日次データ */}
      <section>
        <DailyDataTable
          data={data?.daily_data ?? []}
          loading={loading}
        />
      </section>

      {/* 月次コメント */}
      <section>
        <MonthlyCommentCard
          category="manufacturing"
          period={commentPeriod}
          title="製造分析コメント"
        />
      </section>

      {/* アップロードダイアログ */}
      <ManufacturingUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        year={year}
        month={month}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
