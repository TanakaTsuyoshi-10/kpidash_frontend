/**
 * 通販部門 目標設定ページ
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { TargetPageHeader } from '@/components/targets/TargetPageHeader'
import { EcommerceChannelTable } from '@/components/targets/EcommerceChannelTable'
import { EcommerceCustomerForm } from '@/components/targets/EcommerceCustomerForm'
import { useEcommerceTargets, useEcommerceTargetMutation } from '@/hooks/useTarget'
import { getCurrentMonth } from '@/types/target'
import type { EcommerceChannelTarget, EcommerceCustomerTarget } from '@/types/target'
import { Save, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

export default function EcommerceTargetsPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [channelData, setChannelData] = useState<EcommerceChannelTarget[]>([])
  const [customerData, setCustomerData] = useState<EcommerceCustomerTarget | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const { data, loading, error, refetch } = useEcommerceTargets(month)
  const { save, saving, error: saveError } = useEcommerceTargetMutation()

  // 月が変更されたときに状態をリセット
  useEffect(() => {
    setChannelData([])
    setCustomerData(null)
    setHasChanges(false)
  }, [month])

  // データ取得時に状態を初期化
  useEffect(() => {
    if (data) {
      setChannelData(data.channel_targets)
      setCustomerData(data.customer_target)
    }
  }, [data])

  // チャネルデータ変更
  const handleChannelChange = useCallback((channels: EcommerceChannelTarget[]) => {
    setChannelData(channels)
    setHasChanges(true)
  }, [])

  // 顧客データ変更
  const handleCustomerChange = useCallback((customer: EcommerceCustomerTarget) => {
    setCustomerData(customer)
    setHasChanges(true)
  }, [])

  // 保存
  const handleSave = useCallback(async () => {
    const channelTargets = channelData
      .filter((ch) => ch.target_sales != null || ch.target_buyers != null)
      .map((ch) => ({
        channel: ch.channel,
        sales: ch.target_sales ?? undefined,
        buyers: ch.target_buyers ?? undefined,
      }))

    try {
      const result = await save({
        month,
        channel_targets: channelTargets.length > 0 ? channelTargets : undefined,
        new_customers: customerData?.new_customers ?? undefined,
        repeat_customers: customerData?.repeat_customers ?? undefined,
      })
      alert(`${result.created_count}件作成、${result.updated_count}件更新しました`)
      setHasChanges(false)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }, [channelData, customerData, month, save, refetch])

  // 月変更時にリセット
  const handleMonthChange = useCallback((newMonth: string) => {
    setMonth(newMonth)
    setHasChanges(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <TargetPageHeader
          title="通販部門 目標設定"
          month={month}
          onMonthChange={handleMonthChange}
        />
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>読み込み中...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <TargetPageHeader
          title="通販部門 目標設定"
          month={month}
          onMonthChange={handleMonthChange}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // 表示用データ（状態が空の場合はAPIデータを使用）
  const channels = channelData.length > 0 ? channelData : (data?.channel_targets || [])
  const customer = customerData ?? data?.customer_target ?? null

  return (
    <div className="space-y-6">
      <TargetPageHeader
        title="通販部門 目標設定"
        month={month}
        onMonthChange={handleMonthChange}
      />

      {/* アクションボタン */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetch()
            setHasChanges(false)
          }}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          再読込
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          保存
        </Button>
      </div>

      {/* エラー表示 */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* チャネル別目標 */}
      <EcommerceChannelTable
        channels={channels}
        onChange={handleChannelChange}
      />

      {/* 顧客統計目標 */}
      <EcommerceCustomerForm
        data={customer}
        onChange={handleCustomerChange}
      />

      {/* 説明 */}
      <p className="text-sm text-gray-500">
        ※ 比 = 前年比（(目標 - 前年) / 前年 × 100）。目標値入力時に自動計算されます。
      </p>
    </div>
  )
}
