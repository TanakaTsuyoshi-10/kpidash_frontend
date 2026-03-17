/**
 * ふるさと納税メインコンテンツ
 * 販売実績・リピート情報・返品苦情・口コミの4セクションを表示
 */
'use client'

import { useFurusatoSummary } from '@/hooks/useFurusato'
import { formatCurrency, formatNumber } from '@/types/ecommerce'
import type { PeriodType } from '@/types/ecommerce'
import type { WeeklyData } from '@/types/furusato'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2,
  ShoppingCart,
  Users,
  AlertTriangle,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  カラーテーマ定数                                                    */
/* ------------------------------------------------------------------ */

const sectionColors = {
  sales: {
    headerBg: 'bg-emerald-50',
    headerText: 'text-emerald-700',
    accent: 'text-emerald-700',
    highlightBg: 'bg-emerald-50',
    highlightBorder: 'border-emerald-200',
    tableBg: 'bg-emerald-50/50',
    borderColor: 'border-emerald-300',
  },
  repeat: {
    headerBg: 'bg-blue-50',
    headerText: 'text-blue-700',
    accent: 'text-blue-700',
    highlightBg: 'bg-blue-50',
    highlightBorder: 'border-blue-200',
    tableBg: 'bg-blue-50/50',
    borderColor: 'border-blue-300',
  },
  complaint: {
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-700',
    accent: 'text-amber-700',
    highlightBg: 'bg-amber-50',
    highlightBorder: 'border-amber-200',
    tableBg: 'bg-amber-50/50',
    borderColor: 'border-amber-300',
  },
  review: {
    headerBg: 'bg-purple-50',
    headerText: 'text-purple-700',
    accent: 'text-purple-700',
    highlightBg: 'bg-purple-50',
    highlightBorder: 'border-purple-200',
    tableBg: 'bg-purple-50/50',
    borderColor: 'border-purple-300',
  },
} as const

type SectionKey = keyof typeof sectionColors

const areaColors: Record<string, { bg: string; text: string; border: string }> = {
  '九州': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  '中国・四国': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '関西': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '関東': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'その他': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  month: string
  periodType: PeriodType
}

export function FurusatoContent({ month, periodType }: Props) {
  const { data, loading, error } = useFurusatoSummary(month, periodType)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>データの取得に失敗しました</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>データがありません</p>
        <p className="text-sm mt-1">Excelファイルをアップロードしてください</p>
      </div>
    )
  }

  const { sales, repeat, complaint, review, comments } = data
  const isCumulative = periodType === 'cumulative'

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 販売実績                                                      */}
      {/* ============================================================ */}
      <Card>
        <CardHeader className={`py-4 ${sectionColors.sales.headerBg} rounded-t-lg`}>
          <CardTitle className={`text-lg flex items-center gap-2 ${sectionColors.sales.headerText}`}>
            <ShoppingCart className="h-5 w-5" />
            販売実績
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* KPI ハイライト */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatHighlight label="注文数" value={formatNumber(sales.orders)} section="sales" />
            <StatHighlight label="売上高" value={formatCurrency(sales.sales)} section="sales" />
            <StatHighlight label="単価" value={formatCurrency(sales.unit_price)} section="sales" />
            <StatHighlight label="在庫数" value={formatNumber(sales.inventory)} section="sales" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 pr-4 text-gray-600 font-medium w-48">在庫数</td>
                  <td className="py-2">{formatNumber(sales.inventory)}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-600 font-medium">
                    注文数{isCumulative ? '（単月 / 累計）' : ''}
                  </td>
                  <td className="py-2">
                    {isCumulative
                      ? `${formatNumber(sales.orders)} / ${formatNumber(sales.cumulative_orders)}`
                      : formatNumber(sales.orders)
                    }
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-600 font-medium">
                    売上高{isCumulative ? '（単月 / 累計）' : ''}
                  </td>
                  <td className="py-2">
                    {isCumulative
                      ? `${formatCurrency(sales.sales)} / ${formatCurrency(sales.cumulative_sales)}`
                      : formatCurrency(sales.sales)
                    }
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-600 font-medium">単価</td>
                  <td className="py-2">{formatCurrency(sales.unit_price)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* エリア別注文数 */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">エリア別注文数</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <AreaCard label="九州" value={sales.orders_kyushu} />
              <AreaCard label="中国・四国" value={sales.orders_chugoku_shikoku} />
              <AreaCard label="関西" value={sales.orders_kansai} />
              <AreaCard label="関東" value={sales.orders_kanto} />
              <AreaCard label="その他" value={sales.orders_other} />
            </div>
          </div>

          <WeeklyTable
            weekly={sales.weekly}
            section="sales"
            rows={[
              { label: '注文数', key: 'orders' },
              { label: '売上高', key: 'sales', isCurrency: true },
              { label: '九州', key: 'orders_kyushu' },
              { label: '中国・四国', key: 'orders_chugoku_shikoku' },
              { label: '関西', key: 'orders_kansai' },
              { label: '関東', key: 'orders_kanto' },
              { label: 'その他', key: 'orders_other' },
            ]}
          />

          {comments.sales && (
            <CommentBlock text={comments.sales} section="sales" />
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* リピート情報                                                   */}
      {/* ============================================================ */}
      <Card>
        <CardHeader className={`py-4 ${sectionColors.repeat.headerBg} rounded-t-lg`}>
          <CardTitle className={`text-lg flex items-center gap-2 ${sectionColors.repeat.headerText}`}>
            <Users className="h-5 w-5" />
            リピート情報
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* KPI ハイライト */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <StatHighlight label="新規注文者数" value={formatNumber(repeat.new_customers)} section="repeat" />
            <StatHighlight label="EC購入経験者" value={formatNumber(repeat.ec_site_buyers)} section="repeat" />
            <StatHighlight label="複数回購入" value={formatNumber(repeat.repeat_buyers)} section="repeat" />
          </div>

          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium w-48">当月新規注文者数</td>
                <td className="py-2">{formatNumber(repeat.new_customers)}</td>
              </tr>
              {isCumulative && (
                <tr>
                  <td className="py-2 pr-4 text-gray-600 font-medium">累計新規注文者数</td>
                  <td className="py-2">{formatNumber(repeat.cumulative_new_customers)}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium">ECサイト購入経験者</td>
                <td className="py-2">{formatNumber(repeat.ec_site_buyers)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium">ふるさと納税複数回購入</td>
                <td className="py-2">{formatNumber(repeat.repeat_buyers)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium pl-4">
                  └ 単月で複数回
                </td>
                <td className="py-2">{formatNumber(repeat.repeat_single_month)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium pl-4">
                  └ 複数月で注文
                </td>
                <td className="py-2">{formatNumber(repeat.repeat_multi_month)}</td>
              </tr>
            </tbody>
          </table>
          <WeeklyTable
            weekly={repeat.weekly}
            section="repeat"
            rows={[
              { label: '新規注文者数', key: 'new_customers' },
              { label: 'EC購入経験者', key: 'ec_site_buyers' },
              { label: '複数回購入', key: 'repeat_buyers' },
              { label: '単月複数回', key: 'repeat_single_month' },
              { label: '複数月注文', key: 'repeat_multi_month' },
            ]}
          />

          {comments.repeat && (
            <CommentBlock text={comments.repeat} section="repeat" />
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 返品・苦情情報                                                 */}
      {/* ============================================================ */}
      <Card>
        <CardHeader className={`py-4 ${sectionColors.complaint.headerBg} rounded-t-lg`}>
          <CardTitle className={`text-lg flex items-center gap-2 ${sectionColors.complaint.headerText}`}>
            <AlertTriangle className="h-5 w-5" />
            返品・苦情情報
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* KPI ハイライト */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatHighlight label="再送数" value={formatNumber(complaint.reshipping_count)} section="complaint" />
            <StatHighlight label="苦情数" value={formatNumber(complaint.complaint_count)} section="complaint" />
          </div>

          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium w-48">再送数</td>
                <td className="py-2">{formatNumber(complaint.reshipping_count)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium">苦情数</td>
                <td className="py-2">{formatNumber(complaint.complaint_count)}</td>
              </tr>
            </tbody>
          </table>
          <WeeklyTable
            weekly={complaint.weekly}
            section="complaint"
            rows={[
              { label: '再送数', key: 'reshipping_count' },
              { label: '苦情数', key: 'complaint_count' },
            ]}
          />

          {comments.complaint && (
            <CommentBlock text={comments.complaint} section="complaint" />
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 口コミ情報                                                     */}
      {/* ============================================================ */}
      <Card>
        <CardHeader className={`py-4 ${sectionColors.review.headerBg} rounded-t-lg`}>
          <CardTitle className={`text-lg flex items-center gap-2 ${sectionColors.review.headerText}`}>
            <MessageCircle className="h-5 w-5" />
            口コミ情報
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* KPI ハイライト */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-lg border p-3 ${sectionColors.review.highlightBg} ${sectionColors.review.highlightBorder}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                <p className="text-xs text-green-600 font-medium">ポジティブ</p>
              </div>
              <p className="text-2xl font-bold text-green-600 tabular-nums">
                {formatNumber(review.positive_reviews)}
              </p>
            </div>
            <div className={`rounded-lg border p-3 ${sectionColors.review.highlightBg} ${sectionColors.review.highlightBorder}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                <p className="text-xs text-red-600 font-medium">ネガティブ</p>
              </div>
              <p className="text-2xl font-bold text-red-600 tabular-nums">
                {formatNumber(review.negative_reviews)}
              </p>
            </div>
          </div>

          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 font-medium w-48">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    ポジティブ
                  </span>
                </td>
                <td className="py-2">{formatNumber(review.positive_reviews)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">
                  <span className="flex items-center gap-1.5 text-red-600">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    ネガティブ
                  </span>
                </td>
                <td className="py-2">{formatNumber(review.negative_reviews)}</td>
              </tr>
            </tbody>
          </table>
          <WeeklyTable
            weekly={review.weekly}
            section="review"
            rows={[
              { label: 'ポジティブ', key: 'positive_reviews' },
              { label: 'ネガティブ', key: 'negative_reviews' },
            ]}
          />

          {comments.review && (
            <CommentBlock text={comments.review} section="review" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  StatHighlight — KPI ハイライトカード                                 */
/* ------------------------------------------------------------------ */

function StatHighlight({
  label,
  value,
  section,
}: {
  label: string
  value: string
  section: SectionKey
}) {
  const colors = sectionColors[section]
  return (
    <div className={`rounded-lg border p-3 ${colors.highlightBg} ${colors.highlightBorder}`}>
      <p className={`text-xs ${colors.accent} font-medium mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${colors.accent} tabular-nums`}>{value}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  AreaCard — エリア別注文数カード（色付き）                              */
/* ------------------------------------------------------------------ */

function AreaCard({ label, value }: { label: string; value: number | null }) {
  const colors = areaColors[label] ?? areaColors['その他']
  return (
    <div className={`rounded-lg p-3 text-center border-l-4 border ${colors.bg} ${colors.border}`}>
      <p className={`text-xs mb-1 ${colors.text}`}>{label}</p>
      <p className={`text-lg font-semibold ${colors.text}`}>{formatNumber(value)}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  CommentBlock — コメント表示（アイコン＋色付き左ボーダー）              */
/* ------------------------------------------------------------------ */

function CommentBlock({ text, section }: { text: string; section: SectionKey }) {
  const colors = sectionColors[section]
  return (
    <div className={`mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-start gap-2 border-l-4 ${colors.borderColor}`}>
      <MessageSquare className={`h-4 w-4 mt-0.5 shrink-0 ${colors.accent}`} />
      <span>{text}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  WeeklyTable — 週次内訳テーブル（色付きヘッダー・合計列）              */
/* ------------------------------------------------------------------ */

interface WeeklyRow {
  label: string
  key: string
  isCurrency?: boolean
}

function WeeklyTable({
  weekly,
  section,
  rows,
}: {
  weekly: WeeklyData
  section: SectionKey
  rows: WeeklyRow[]
}) {
  if (!weekly) return null

  const colors = sectionColors[section]
  const weeks = ['第1週', '第2週', '第3週', '第4週', '第5週']

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">週次内訳</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className={`border-b border-gray-200 ${colors.tableBg}`}>
              <th className={`py-2 pr-4 text-left font-medium w-40 ${colors.accent}`}>項目</th>
              {weeks.map((w) => (
                <th key={w} className="py-2 px-2 text-right text-gray-500 font-medium">{w}</th>
              ))}
              <th className={`py-2 pl-2 text-right font-medium ${colors.accent}`}>合計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ label, key, isCurrency }) => {
              const values = weekly[key]
              if (!values) return null
              const fmt = isCurrency ? formatCurrency : formatNumber
              const total = values.reduce<number | null>((sum, v) => {
                if (v == null) return sum
                return (sum ?? 0) + v
              }, null)
              return (
                <tr key={key} className="even:bg-gray-50/50">
                  <td className="py-1.5 pr-4 text-gray-600">{label}</td>
                  {values.map((v, i) => (
                    <td key={i} className="py-1.5 px-2 text-right tabular-nums">{fmt(v)}</td>
                  ))}
                  <td className={`py-1.5 pl-2 text-right font-bold tabular-nums ${colors.accent}`}>{fmt(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
