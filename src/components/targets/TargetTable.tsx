/**
 * 目標値一覧テーブルコンポーネント
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TargetValue } from '@/types/upload'
import { getTargets, upsertTarget, deleteTarget } from '@/lib/api/upload'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  fiscalYear: number
  departmentId?: string
  kpiName?: string
  refreshKey?: number
}

export function TargetTable({ fiscalYear, departmentId, kpiName, refreshKey }: Props) {
  const [targets, setTargets] = useState<TargetValue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTarget, setEditingTarget] = useState<TargetValue | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<TargetValue | null>(null)

  useEffect(() => {
    fetchTargets()
  }, [fiscalYear, departmentId, kpiName, refreshKey])

  const fetchTargets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getTargets(fiscalYear, departmentId, kpiName)
      setTargets(response?.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setTargets([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (target: TargetValue) => {
    setEditingTarget(target)
    setEditValue(target.target_value.toLocaleString())
  }

  const handleSaveEdit = async () => {
    if (!editingTarget) return

    const value = parseFloat(editValue.replace(/,/g, ''))
    if (isNaN(value)) {
      return
    }

    try {
      await upsertTarget({
        kpi_name: editingTarget.kpi_name,
        period: editingTarget.period,
        target_value: value,
        department_id: editingTarget.department_id,
      })
      setEditingTarget(null)
      fetchTargets()
    } catch (err) {
      console.error('更新に失敗しました', err)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmTarget?.id) return

    try {
      await deleteTarget(deleteConfirmTarget.id)
      setDeleteConfirmTarget(null)
      fetchTargets()
    } catch (err) {
      console.error('削除に失敗しました', err)
    }
  }

  const formatNumber = (value: string) => {
    const num = value.replace(/,/g, '').replace(/[^0-9]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>目標値一覧</CardTitle>
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
          <CardTitle>目標値一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  // KPI項目ごとにグループ化
  const groupedTargets = targets.reduce<Record<string, TargetValue[]>>((acc, target) => {
    if (!acc[target.kpi_name]) {
      acc[target.kpi_name] = []
    }
    acc[target.kpi_name].push(target)
    return acc
  }, {})

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>目標値一覧 ({fiscalYear}年度)</CardTitle>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              目標値が設定されていません
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTargets).map(([kpi, items]) => (
                <div key={kpi} className="space-y-2">
                  <h3 className="font-medium text-gray-700">{kpi}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>対象月</TableHead>
                        <TableHead className="text-right">目標値</TableHead>
                        <TableHead className="w-32"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items
                        .sort((a, b) => a.period.localeCompare(b.period))
                        .map((target) => (
                          <TableRow key={target.id || `${target.kpi_name}-${target.period}`}>
                            <TableCell>
                              {format(parseISO(target.period), 'yyyy年M月', { locale: ja })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {target.target_value.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(target)}
                                >
                                  編集
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => setDeleteConfirmTarget(target)}
                                >
                                  削除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingTarget} onOpenChange={() => setEditingTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>目標値を編集</DialogTitle>
          </DialogHeader>
          {editingTarget && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">KPI項目: </span>
                  {editingTarget.kpi_name}
                </div>
                <div>
                  <span className="text-gray-500">対象月: </span>
                  {format(parseISO(editingTarget.period), 'yyyy年M月', { locale: ja })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>目標値</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editValue}
                  onChange={(e) => setEditValue(formatNumber(e.target.value))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTarget(null)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteConfirmTarget} onOpenChange={() => setDeleteConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>削除の確認</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            この目標値を削除してもよろしいですか？
            {deleteConfirmTarget && (
              <span className="block mt-2 text-gray-600">
                {deleteConfirmTarget.kpi_name} - {format(parseISO(deleteConfirmTarget.period), 'yyyy年M月', { locale: ja })}
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmTarget(null)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
