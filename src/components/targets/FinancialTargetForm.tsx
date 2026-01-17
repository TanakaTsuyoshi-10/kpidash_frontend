/**
 * 財務目標設定フォームコンポーネント
 */
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { YoYBadge } from './YoYBadge'
import { useFinancialTargets, useFinancialTargetMutation } from '@/hooks/useTarget'
import {
  formatNumber,
  parseInputValue,
  calculateYoY,
  calculateSalesRatio,
} from '@/types/target'
import type { FinancialTargetItem, FinancialTargetInput } from '@/types/target'
import { cn } from '@/lib/utils'
import { Save, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  month: string
  onSaveSuccess?: () => void
}

interface FormState {
  [key: string]: string
}

export function FinancialTargetForm({ month, onSaveSuccess }: Props) {
  const [formState, setFormState] = useState<FormState>({})
  const [originalState, setOriginalState] = useState<FormState>({})

  const { data, loading, error, refetch } = useFinancialTargets(month)
  const { save, saving, error: saveError } = useFinancialTargetMutation()

  // 月が変更されたときに状態をリセット
  useEffect(() => {
    setFormState({})
    setOriginalState({})
  }, [month])

  // データ取得時に状態を初期化
  useEffect(() => {
    if (data) {
      const form: FormState = {}
      const original: FormState = {}

      const initItems = (items: FinancialTargetItem[], prefix: string) => {
        for (const item of items) {
          const key = `${prefix}.${item.field_name}`
          form[key] = item.target_value != null ? formatNumber(item.target_value) : ''
          original[key] = form[key]
        }
      }

      initItems(data.summary_items, 'summary')
      initItems(data.cost_items, 'cost')
      initItems(data.sga_items, 'sga')

      setFormState(form)
      setOriginalState(original)
    }
  }, [data])

  // 値変更
  const handleChange = useCallback((key: string, value: string) => {
    const cleaned = value.replace(/[^0-9,-]/g, '')
    setFormState((prev) => ({ ...prev, [key]: cleaned }))
  }, [])

  // ブラー時にフォーマット
  const handleBlur = useCallback((key: string) => {
    const value = formState[key]
    if (value === '' || value === '-') return

    try {
      const num = parseInputValue(value)
      if (num !== null) {
        setFormState((prev) => ({ ...prev, [key]: formatNumber(num) }))
      }
    } catch {
      setFormState((prev) => ({ ...prev, [key]: originalState[key] || '' }))
    }
  }, [formState, originalState])

  // 変更チェック
  const hasChanges = useMemo(() => {
    return Object.keys(formState).some((key) => formState[key] !== originalState[key])
  }, [formState, originalState])

  // 自動計算値を取得
  const getCalculatedValues = useCallback(() => {
    const getValue = (key: string): number | null => {
      try {
        return parseInputValue(formState[key] || '')
      } catch {
        return null
      }
    }

    const salesTotal = getValue('summary.sales_total')
    const costOfSales = getValue('summary.cost_of_sales')
    const sgaTotal = getValue('summary.sga_total')

    const grossProfit = salesTotal !== null && costOfSales !== null
      ? salesTotal - costOfSales
      : null

    const operatingProfit = grossProfit !== null && sgaTotal !== null
      ? grossProfit - sgaTotal
      : null

    return { grossProfit, operatingProfit, salesTotal }
  }, [formState])

  // 保存
  const handleSave = useCallback(async () => {
    const getValue = (key: string): number | null => {
      try {
        return parseInputValue(formState[key] || '')
      } catch {
        return null
      }
    }

    const input: FinancialTargetInput = {
      month,
      summary: {
        sales_total: getValue('summary.sales_total'),
        sales_store: getValue('summary.sales_store'),
        sales_online: getValue('summary.sales_online'),
        cost_of_sales: getValue('summary.cost_of_sales'),
        sga_total: getValue('summary.sga_total'),
      },
      cost_details: {
        purchases: getValue('cost.purchases'),
        raw_material_purchases: getValue('cost.raw_material_purchases'),
        labor_cost: getValue('cost.labor_cost'),
        consumables: getValue('cost.consumables'),
        rent: getValue('cost.rent'),
        repairs: getValue('cost.repairs'),
        utilities: getValue('cost.utilities'),
      },
      sga_details: {
        executive_compensation: getValue('sga.executive_compensation'),
        personnel_cost: getValue('sga.personnel_cost'),
        delivery_cost: getValue('sga.delivery_cost'),
        packaging_cost: getValue('sga.packaging_cost'),
        payment_fees: getValue('sga.payment_fees'),
        freight_cost: getValue('sga.freight_cost'),
        sales_commission: getValue('sga.sales_commission'),
        advertising_cost: getValue('sga.advertising_cost'),
      },
    }

    try {
      const result = await save(input)
      alert(`${result.created_count}件作成、${result.updated_count}件更新しました`)
      refetch()
      onSaveSuccess?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }, [formState, month, save, refetch, onSaveSuccess])

  // 項目行をレンダリング
  const renderItemRow = (
    item: FinancialTargetItem,
    prefix: string,
    salesTotal: number | null
  ) => {
    const key = `${prefix}.${item.field_name}`
    const isModified = formState[key] !== originalState[key]

    // 現在の入力値から前年比を計算
    let currentYoY: number | null = null
    let currentSalesRatio: number | null = null
    try {
      const currentValue = parseInputValue(formState[key] || '')
      currentYoY = calculateYoY(currentValue, item.last_year_actual)
      currentSalesRatio = calculateSalesRatio(currentValue, salesTotal)
    } catch {
      // エラー時は計算しない
    }

    return (
      <TableRow key={item.field_name}>
        <TableCell className={cn('font-medium', item.is_calculated && 'text-gray-500')}>
          {item.display_name}
        </TableCell>
        <TableCell className="p-1 w-[150px]">
          {item.is_calculated ? (
            <div className="text-right font-mono text-gray-500 px-3">
              (自動計算)
            </div>
          ) : (
            <Input
              type="text"
              inputMode="numeric"
              value={formState[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={() => handleBlur(key)}
              className={cn(
                'text-right font-mono h-8',
                isModified && 'bg-yellow-50 border-yellow-400'
              )}
              placeholder="-"
            />
          )}
        </TableCell>
        <TableCell className="text-right font-mono text-sm text-gray-500">
          {item.last_year_actual != null ? formatNumber(item.last_year_actual) : '-'}
        </TableCell>
        <TableCell className="text-right text-sm">
          {currentSalesRatio != null ? `${currentSalesRatio.toFixed(1)}%` : '-'}
        </TableCell>
        <TableCell className="text-right">
          <YoYBadge rate={currentYoY} />
        </TableCell>
      </TableRow>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const { grossProfit, operatingProfit, salesTotal } = getCalculatedValues()

  return (
    <div className="space-y-6">
      {/* アクションボタン */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
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

      {/* サマリー項目 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">サマリー項目</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目</TableHead>
                <TableHead className="text-right w-[150px]">目標値(千円)</TableHead>
                <TableHead className="text-right w-[100px]">前年実績</TableHead>
                <TableHead className="text-right w-[80px]">売上対比</TableHead>
                <TableHead className="text-right w-[80px]">前年比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.summary_items.map((item) => renderItemRow(item, 'summary', salesTotal))}
              {/* 自動計算行: 売上総利益 */}
              <TableRow className="bg-gray-50">
                <TableCell className="font-medium text-gray-500">売上総利益</TableCell>
                <TableCell className="text-right font-mono text-gray-500">
                  {grossProfit != null ? formatNumber(grossProfit) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-gray-500">-</TableCell>
                <TableCell className="text-right text-sm">
                  {salesTotal && grossProfit != null
                    ? `${((grossProfit / salesTotal) * 100).toFixed(1)}%`
                    : '-'}
                </TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
              {/* 自動計算行: 営業利益 */}
              <TableRow className="bg-gray-50">
                <TableCell className="font-medium text-gray-500">営業利益</TableCell>
                <TableCell className="text-right font-mono text-gray-500">
                  {operatingProfit != null ? formatNumber(operatingProfit) : '-'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-gray-500">-</TableCell>
                <TableCell className="text-right text-sm">
                  {salesTotal && operatingProfit != null
                    ? `${((operatingProfit / salesTotal) * 100).toFixed(1)}%`
                    : '-'}
                </TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 売上原価明細 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">売上原価明細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目</TableHead>
                <TableHead className="text-right w-[150px]">目標値(千円)</TableHead>
                <TableHead className="text-right w-[100px]">前年実績</TableHead>
                <TableHead className="text-right w-[80px]">売上対比</TableHead>
                <TableHead className="text-right w-[80px]">前年比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.cost_items.map((item) => renderItemRow(item, 'cost', salesTotal))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 販管費明細 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">販管費明細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目</TableHead>
                <TableHead className="text-right w-[150px]">目標値(千円)</TableHead>
                <TableHead className="text-right w-[100px]">前年実績</TableHead>
                <TableHead className="text-right w-[80px]">売上対比</TableHead>
                <TableHead className="text-right w-[80px]">前年比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.sga_items.map((item) => renderItemRow(item, 'sga', salesTotal))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
