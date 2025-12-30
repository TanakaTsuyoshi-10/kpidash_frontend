/**
 * 地区別目標設定モーダル
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRegions, useRegionalTargets } from '@/hooks/useRegional'
import { Loader2, Save } from 'lucide-react'
import type { SaveRegionalTargetRequest } from '@/types/regional'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
}

interface TargetInputs {
  [regionId: string]: {
    target_sales: string
    target_customers: string
  }
}

export function RegionalTargetModal({ open, onOpenChange, month }: Props) {
  const { regions, loading: regionsLoading } = useRegions()
  const { targets, loading: targetsLoading, saving, error, save } = useRegionalTargets(
    month
  )

  const [inputs, setInputs] = useState<TargetInputs>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  // 地区と目標データからinputsを初期化
  useEffect(() => {
    if (regions.length > 0) {
      const newInputs: TargetInputs = {}
      regions.forEach((region) => {
        const existingTarget = targets.find((t) => t.region_id === region.id)
        newInputs[region.id] = {
          target_sales: existingTarget?.target_sales?.toString() ?? '',
          target_customers: existingTarget?.target_customers?.toString() ?? '',
        }
      })
      setInputs(newInputs)
    }
  }, [regions, targets])

  const handleInputChange = (
    regionId: string,
    field: 'target_sales' | 'target_customers',
    value: string
  ) => {
    // 数値以外は除外
    const numericValue = value.replace(/[^0-9]/g, '')
    setInputs((prev) => ({
      ...prev,
      [regionId]: {
        ...prev[regionId],
        [field]: numericValue,
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaveError(null)
      const targetData: SaveRegionalTargetRequest[] = regions.map((region) => {
        const input = inputs[region.id] || { target_sales: '', target_customers: '' }
        return {
          region_id: region.id,
          month,
          target_sales: input.target_sales ? parseInt(input.target_sales, 10) : null,
          target_customers: input.target_customers
            ? parseInt(input.target_customers, 10)
            : null,
        }
      })
      await save(targetData)
      onOpenChange(false)
    } catch {
      setSaveError('保存に失敗しました')
    }
  }

  const loading = regionsLoading || targetsLoading

  // 数値を3桁区切りでフォーマット
  const formatDisplayValue = (value: string): string => {
    if (!value) return ''
    const num = parseInt(value, 10)
    if (isNaN(num)) return value
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>地区別目標設定</DialogTitle>
          <DialogDescription>
            {month}の各地区の売上目標と購入者数目標を設定します。
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">読み込み中...</span>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">地区</TableHead>
                  <TableHead className="text-right">売上目標（円）</TableHead>
                  <TableHead className="text-right">購入者数目標（人）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-medium">{region.name}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <div className="relative w-[180px]">
                          <Input
                            type="text"
                            value={formatDisplayValue(inputs[region.id]?.target_sales ?? '')}
                            onChange={(e) => {
                              // フォーマットされた値から数字のみを抽出
                              const rawValue = e.target.value.replace(/[^0-9]/g, '')
                              handleInputChange(region.id, 'target_sales', rawValue)
                            }}
                            placeholder="0"
                            className="text-right pr-8 font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            円
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <div className="relative w-[120px]">
                          <Input
                            type="text"
                            value={formatDisplayValue(
                              inputs[region.id]?.target_customers ?? ''
                            )}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/[^0-9]/g, '')
                              handleInputChange(region.id, 'target_customers', rawValue)
                            }}
                            placeholder="0"
                            className="text-right pr-8 font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            人
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {(error || saveError) && (
          <div className="text-sm text-red-600">{error || saveError}</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
