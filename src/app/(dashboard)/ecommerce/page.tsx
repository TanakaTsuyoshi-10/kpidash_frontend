/**
 * 通販分析ページ
 */
'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FiscalMonthSelector } from '@/components/dashboard/FiscalMonthSelector'
import { ChannelSummaryTable } from '@/components/ecommerce/ChannelSummaryTable'
import { ProductSalesTable } from '@/components/ecommerce/ProductSalesTable'
import type { PeriodType } from '@/types/ecommerce'
import { CustomerStats } from '@/components/ecommerce/CustomerStats'
import { WebsiteStats } from '@/components/ecommerce/WebsiteStats'
import { ChannelTrendChart } from '@/components/ecommerce/ChannelTrendChart'
import { ExcelUploadModal } from '@/components/ecommerce/ExcelUploadModal'
import { TargetAchievementCard } from '@/components/ecommerce/TargetAchievementCard'
import { MonthlyCommentCard } from '@/components/dashboard/MonthlyCommentCard'
import { cn } from '@/lib/utils'

export default function EcommercePage() {
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // 日付をパース
  const [year, monthNum] = month.substring(0, 7).split('-').map(Number)

  // 会計年度の開始年を計算（9月起点）
  // 例: 2024年9月〜2025年8月 は 2025年度
  // fiscalYearStart は累計表示用のカレンダー年（年度の開始年）
  const fiscalYearStart = monthNum >= 9 ? year : year - 1
  // fiscalYear は年度名（2025年度など）
  const fiscalYear = monthNum >= 9 ? year + 1 : year

  // 累計モードかどうか
  const isCumulative = periodType === 'cumulative'

  // タイトル
  const periodLabel = isCumulative
    ? `累計（${fiscalYearStart}/9〜${year}/${monthNum}）`
    : `${year}/${monthNum}`

  // アップロード成功時にデータを再読み込み
  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">通販分析</h1>
          <p className="text-sm text-gray-500 mt-1">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* 期間タイプ切り替え */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
            <button
              onClick={() => setPeriodType('monthly')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                periodType === 'monthly'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              単月
            </button>
            <button
              onClick={() => setPeriodType('cumulative')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 whitespace-nowrap',
                periodType === 'cumulative'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              累計
            </button>
          </div>

          {/* 年度・月選択 */}
          <FiscalMonthSelector value={month} onChange={setMonth} />

          {/* アップロードボタン */}
          <Button
            variant="outline"
            onClick={() => setUploadModalOpen(true)}
            className="shrink-0"
          >
            <Upload className="h-4 w-4 mr-2" />
            アップロード
          </Button>
        </div>
      </div>

      {/* チャネル別実績 */}
      <ChannelSummaryTable month={month} periodType={periodType} />

      {/* 目標達成状況（単月表示時のみ） */}
      {periodType === 'monthly' && (
        <TargetAchievementCard month={month} />
      )}

      {/* 商品別売上 */}
      <ProductSalesTable month={month} periodType={periodType} />

      {/* 顧客統計 */}
      <CustomerStats month={month} periodType={periodType} />

      {/* HPアクセス数 */}
      <WebsiteStats month={month} periodType={periodType} />

      {/* 推移グラフ */}
      <ChannelTrendChart fiscalYear={fiscalYear} />

      {/* 月次コメント */}
      <MonthlyCommentCard
        category="ecommerce"
        period={month}
        title="月次コメント"
      />

      {/* Excelアップロードモーダル */}
      <ExcelUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
