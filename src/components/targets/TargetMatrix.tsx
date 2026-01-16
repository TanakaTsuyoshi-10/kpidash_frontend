/**
 * 目標値入力マトリックス
 */
'use client'

import { useState, useCallback, useMemo, useEffect, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTargetMatrix, useTargetMutations } from '@/hooks/useTarget'
import {
  formatNumber,
  parseInputValue,
  generateMonthOptions,
  getCurrentFiscalYear,
  getCurrentMonth,
} from '@/types/target'
import type { CellChange, TargetMatrixCell } from '@/types/target'
import { cn } from '@/lib/utils'
import { Save, RefreshCw, Loader2 } from 'lucide-react'

interface Props {
  departmentSlug?: string
}

interface EditState {
  [key: string]: string // key: `${segmentId}-${kpiId}`, value: 入力値
}

export function TargetMatrix({ departmentSlug = 'store' }: Props) {
  const fiscalYear = getCurrentFiscalYear()
  const monthOptions = useMemo(() => generateMonthOptions(fiscalYear), [fiscalYear])
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [editState, setEditState] = useState<EditState>({})
  const [originalState, setOriginalState] = useState<Record<string, TargetMatrixCell>>({})

  const { data, loading, error, refetch } = useTargetMatrix(departmentSlug, selectedMonth)
  const { saving, error: saveError, saveBulk } = useTargetMutations()

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
    // カンマを許可しつつ、数字とカンマ以外を除外
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
      // 無効な値の場合は元に戻す
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

  // 一括保存
  const handleSave = useCallback(async () => {
    if (!data) return

    const changes: CellChange[] = []
    for (const row of data.rows) {
      for (const kpi of data.kpis) {
        const key = `${row.segment_id}-${kpi.id}`
        const original = originalState[key]
        const current = editState[key] || ''
        const originalFormatted = original?.value != null ? formatNumber(original.value) : ''

        if (current !== originalFormatted) {
          let newValue: number | null = null
          try {
            newValue = parseInputValue(current)
          } catch {
            // 無効な値はスキップ
            continue
          }

          changes.push({
            segmentId: row.segment_id,
            kpiId: kpi.id,
            targetId: original?.target_id ?? null,
            value: newValue,
            originalValue: original?.value ?? null,
          })
        }
      }
    }

    if (changes.length === 0) return

    try {
      const result = await saveBulk(changes, selectedMonth)
      if (result.success) {
        alert(`${result.created_count}件作成、${result.updated_count}件更新しました`)
        refetch()
      } else {
        alert(`エラー: ${result.errors.join(', ')}`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }, [data, editState, originalState, selectedMonth, saveBulk, refetch])

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>目標値設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>目標値設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.rows.length === 0 || data.kpis.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>目標値設定</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>目標値設定 ({data.fiscal_year}年度)</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            読込
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
            一括保存
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {saveError}
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white min-w-[120px]">
                  店舗名
                </TableHead>
                {data.kpis.map((kpi) => (
                  <Fragment key={kpi.id}>
                    <TableHead
                      className="text-right min-w-[100px] whitespace-nowrap bg-gray-50 text-gray-500 text-xs"
                    >
                      前年実績
                    </TableHead>
                    <TableHead
                      className="text-right min-w-[140px] whitespace-nowrap"
                    >
                      {kpi.name}
                      <span className="text-xs text-gray-400 ml-1">({kpi.unit})</span>
                    </TableHead>
                  </Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.segment_id}>
                  <TableCell className="sticky left-0 bg-white font-medium">
                    {row.segment_name}
                  </TableCell>
                  {data.kpis.map((kpi) => {
                    const key = `${row.segment_id}-${kpi.id}`
                    const cell = row.values[kpi.id]
                    const isModified = isCellModified(row.segment_id, kpi.id)
                    return (
                      <Fragment key={kpi.id}>
                        <TableCell
                          className="text-right font-mono text-sm text-gray-500 bg-gray-50 px-3"
                        >
                          {cell?.last_year_actual != null
                            ? formatNumber(cell.last_year_actual)
                            : '-'}
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={editState[key] ?? ''}
                            onChange={(e) =>
                              handleCellChange(row.segment_id, kpi.id, e.target.value)
                            }
                            onBlur={() => handleCellBlur(row.segment_id, kpi.id)}
                            className={cn(
                              'text-right font-mono h-8',
                              isModified && 'bg-yellow-50 border-yellow-400'
                            )}
                            placeholder="-"
                          />
                        </TableCell>
                      </Fragment>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          変更したセルは黄色でハイライトされます。「一括保存」ボタンで全ての変更を保存できます。
        </div>
      </CardContent>
    </Card>
  )
}
