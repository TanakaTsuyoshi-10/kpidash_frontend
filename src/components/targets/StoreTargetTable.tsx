/**
 * 店舗目標設定テーブル（前年比付き）
 */
'use client'

import { useState, useCallback, useMemo, useEffect, Fragment } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useStoreTargets, useStoreTargetMutation } from '@/hooks/useTarget'
import {
  formatNumber,
  parseInputValue,
  calculateYoY,
} from '@/types/target'
import type { CellChange, TargetMatrixCell, StoreTargetBulkInput } from '@/types/target'
import { cn } from '@/lib/utils'
import { Save, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  month: string
  onSaveSuccess?: () => void
}

interface EditState {
  [key: string]: string
}

export function StoreTargetTable({ month, onSaveSuccess }: Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [originalState, setOriginalState] = useState<Record<string, TargetMatrixCell>>({})

  const { data, loading, error, refetch } = useStoreTargets(month)
  const { save, saving, error: saveError } = useStoreTargetMutation()

  // 月が変更されたときに状態をリセット
  useEffect(() => {
    setEditState({})
    setOriginalState({})
  }, [month])

  // データ取得時に元の状態を保存
  useEffect(() => {
    if (data) {
      const original: Record<string, TargetMatrixCell> = {}
      const edit: EditState = {}
      for (const row of data.rows) {
        for (const kpi of data.kpis) {
          const key = `${row.segment_id}-${kpi.id}`
          const cell = row.values[kpi.id]
          original[key] = cell ?? { target_id: null, value: null, last_year_actual: null }
          edit[key] = cell?.value != null ? formatNumber(cell.value) : ''
        }
      }
      setOriginalState(original)
      setEditState(edit)
    }
  }, [data])

  // セルの値変更
  const handleCellChange = useCallback((segmentId: string, kpiId: string, value: string) => {
    const key = `${segmentId}-${kpiId}`
    const cleaned = value.replace(/[^0-9,]/g, '')
    setEditState((prev) => ({ ...prev, [key]: cleaned }))
  }, [])

  // セルがブラーした時にフォーマット
  const handleCellBlur = useCallback((segmentId: string, kpiId: string) => {
    const key = `${segmentId}-${kpiId}`
    const value = editState[key]
    if (value === '') return

    try {
      const num = parseInputValue(value)
      if (num !== null) {
        setEditState((prev) => ({ ...prev, [key]: formatNumber(num) }))
      }
    } catch {
      const original = originalState[key]
      setEditState((prev) => ({
        ...prev,
        [key]: original?.value != null ? formatNumber(original.value) : '',
      }))
    }
  }, [editState, originalState])

  // 変更があるかチェック
  const hasChanges = useMemo(() => {
    if (!data) return false
    for (const row of data.rows) {
      for (const kpi of data.kpis) {
        const key = `${row.segment_id}-${kpi.id}`
        const original = originalState[key]
        const current = editState[key] || ''
        const originalFormatted = original?.value != null ? formatNumber(original.value) : ''
        if (current !== originalFormatted) return true
      }
    }
    return false
  }, [data, editState, originalState])

  // 保存
  const handleSave = useCallback(async () => {
    if (!data) return

    const targets: StoreTargetBulkInput['targets'] = []
    for (const row of data.rows) {
      for (const kpi of data.kpis) {
        const key = `${row.segment_id}-${kpi.id}`
        const current = editState[key] || ''

        try {
          const value = parseInputValue(current)
          if (value !== null) {
            targets.push({
              segment_id: row.segment_id,
              kpi_id: kpi.id,
              value,
            })
          }
        } catch {
          // 無効な値はスキップ
        }
      }
    }

    try {
      const result = await save({ month, targets })
      alert(`${result.created_count}件作成、${result.updated_count}件更新しました`)
      refetch()
      onSaveSuccess?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }, [data, editState, month, save, refetch, onSaveSuccess])

  // セルが変更されているかチェック
  const isCellModified = useCallback(
    (segmentId: string, kpiId: string) => {
      const key = `${segmentId}-${kpiId}`
      const original = originalState[key]
      const current = editState[key] || ''
      const originalFormatted = original?.value != null ? formatNumber(original.value) : ''
      return current !== originalFormatted
    },
    [editState, originalState]
  )

  // 現在の入力値から前年比を計算
  const getCurrentYoY = useCallback(
    (segmentId: string, kpiId: string) => {
      const key = `${segmentId}-${kpiId}`
      const current = editState[key] || ''
      const original = originalState[key]

      try {
        const value = parseInputValue(current)
        return calculateYoY(value, original?.last_year_actual ?? null)
      } catch {
        return null
      }
    },
    [editState, originalState]
  )

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

  if (!data || data.rows.length === 0 || data.kpis.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-400">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
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

      {/* テーブル */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    rowSpan={2}
                    className="sticky left-0 z-10 bg-white min-w-[120px] border-r"
                  >
                    店舗
                  </TableHead>
                  {data.kpis.map((kpi) => (
                    <TableHead
                      key={kpi.id}
                      colSpan={3}
                      className="text-center border-l border-gray-200"
                    >
                      {kpi.name}
                      {kpi.unit && (
                        <span className="text-xs text-gray-400 ml-1">({kpi.unit})</span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow>
                  {data.kpis.map((kpi) => (
                    <Fragment key={kpi.id}>
                      <TableHead className="text-right text-xs min-w-[100px] bg-gray-50 border-l">
                        目標
                      </TableHead>
                      <TableHead className="text-right text-xs min-w-[80px] bg-gray-50">
                        前年
                      </TableHead>
                      <TableHead className="text-right text-xs min-w-[70px] bg-gray-50">
                        比
                      </TableHead>
                    </Fragment>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.segment_id}>
                    <TableCell className="sticky left-0 z-10 bg-white font-medium border-r">
                      {row.segment_name}
                    </TableCell>
                    {data.kpis.map((kpi) => {
                      const key = `${row.segment_id}-${kpi.id}`
                      const cell = row.values[kpi.id]
                      const isModified = isCellModified(row.segment_id, kpi.id)
                      const yoyRate = getCurrentYoY(row.segment_id, kpi.id)

                      return (
                        <Fragment key={kpi.id}>
                          <TableCell className="p-1 border-l">
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={editState[key] ?? ''}
                              onChange={(e) =>
                                handleCellChange(row.segment_id, kpi.id, e.target.value)
                              }
                              onBlur={() => handleCellBlur(row.segment_id, kpi.id)}
                              className={cn(
                                'text-right font-mono h-8 w-full',
                                isModified && 'bg-yellow-50 border-yellow-400'
                              )}
                              placeholder="-"
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-500 bg-gray-50 px-2">
                            {cell?.last_year_actual != null
                              ? formatNumber(cell.last_year_actual)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right px-2 bg-gray-50">
                            <YoYBadge rate={yoyRate} />
                          </TableCell>
                        </Fragment>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 説明 */}
      <p className="text-sm text-gray-500">
        ※ 比 = 前年比（(目標 - 前年) ÷ 前年 × 100）。目標値入力時に自動計算されます。
      </p>
    </div>
  )
}
