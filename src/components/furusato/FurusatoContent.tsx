/**
 * ふるさと納税メインコンテンツ
 * 販売実績・リピート情報・返品苦情・口コミの4セクションを表示
 */
'use client'

import { useFurusatoSummary } from '@/hooks/useFurusato'
import { formatCurrency, formatNumber } from '@/types/ecommerce'
import type { PeriodType } from '@/types/ecommerce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

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
      {/* 販売実績 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">販売実績</CardTitle>
        </CardHeader>
        <CardContent>
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

          {comments.sales && (
            <CommentBlock text={comments.sales} />
          )}
        </CardContent>
      </Card>

      {/* リピート情報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">リピート情報</CardTitle>
        </CardHeader>
        <CardContent>
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
          {comments.repeat && (
            <CommentBlock text={comments.repeat} />
          )}
        </CardContent>
      </Card>

      {/* 返品・苦情情報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">返品・苦情情報</CardTitle>
        </CardHeader>
        <CardContent>
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
          {comments.complaint && (
            <CommentBlock text={comments.complaint} />
          )}
        </CardContent>
      </Card>

      {/* 口コミ情報 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">口コミ情報</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium w-48">ポジティブ</td>
                <td className="py-2">{formatNumber(review.positive_reviews)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-600 font-medium">ネガティブ</td>
                <td className="py-2">{formatNumber(review.negative_reviews)}</td>
              </tr>
            </tbody>
          </table>
          {comments.review && (
            <CommentBlock text={comments.review} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AreaCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold">{formatNumber(value)}</p>
    </div>
  )
}

function CommentBlock({ text }: { text: string }) {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
      {text}
    </div>
  )
}
