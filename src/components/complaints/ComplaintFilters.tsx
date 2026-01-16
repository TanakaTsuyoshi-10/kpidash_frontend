/**
 * クレームフィルターコンポーネント
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import type {
  ComplaintStatus,
  DepartmentType,
  ComplaintType,
  ComplaintFilterParams,
  ComplaintMasterDataResponse,
} from '@/types/complaint'

interface Props {
  filters: ComplaintFilterParams
  onChange: (filters: ComplaintFilterParams) => void
  masterData?: ComplaintMasterDataResponse | null
}

const statusOptions: { value: ComplaintStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'in_progress', label: '対応中' },
  { value: 'completed', label: '対応済' },
]

const defaultDepartmentOptions: { value: DepartmentType | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'store', label: '店舗' },
  { value: 'ecommerce', label: '通販' },
  { value: 'headquarters', label: '本社' },
]

const defaultComplaintTypeOptions: { value: ComplaintType | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'customer_service', label: '接客関連' },
  { value: 'facility', label: '店舗設備' },
  { value: 'operation', label: '操作方法' },
  { value: 'product', label: '味・商品' },
  { value: 'other', label: 'その他' },
]

export function ComplaintFilters({ filters, onChange, masterData }: Props) {
  // マスタデータがあれば使用、なければデフォルト
  const departmentOptions = masterData?.department_types?.length
    ? [{ value: 'all' as const, label: 'すべて' }, ...masterData.department_types.map(d => ({ value: d.code as DepartmentType | 'all', label: d.name }))]
    : defaultDepartmentOptions

  const complaintTypeOptions = masterData?.complaint_types?.length
    ? [{ value: 'all' as const, label: 'すべて' }, ...masterData.complaint_types.map(t => ({ value: t.code as ComplaintType | 'all', label: t.name }))]
    : defaultComplaintTypeOptions

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      status: value === 'all' ? undefined : (value as ComplaintStatus),
    })
  }

  const handleDepartmentChange = (value: string) => {
    onChange({
      ...filters,
      department_type: value === 'all' ? undefined : (value as DepartmentType),
    })
  }

  const handleComplaintTypeChange = (value: string) => {
    onChange({
      ...filters,
      complaint_type: value === 'all' ? undefined : (value as ComplaintType),
    })
  }

  const handleSearchChange = (value: string) => {
    onChange({
      ...filters,
      search: value || undefined,
    })
  }

  const handleFromDateChange = (value: string) => {
    onChange({
      ...filters,
      from_date: value || undefined,
    })
  }

  const handleToDateChange = (value: string) => {
    onChange({
      ...filters,
      to_date: value || undefined,
    })
  }

  const handleClear = () => {
    onChange({})
  }

  const hasFilters = !!(
    filters.status ||
    filters.department_type ||
    filters.complaint_type ||
    filters.search ||
    filters.from_date ||
    filters.to_date
  )

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* ステータス */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">対応状況</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="対応状況" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 発生部署 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">発生部署</Label>
            <Select
              value={filters.department_type || 'all'}
              onValueChange={handleDepartmentChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="発生部署" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* クレーム種類 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">クレーム種類</Label>
            <Select
              value={filters.complaint_type || 'all'}
              onValueChange={handleComplaintTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="種類" />
              </SelectTrigger>
              <SelectContent>
                {complaintTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 期間（開始） */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">発生日（開始）</Label>
            <Input
              type="date"
              value={filters.from_date || ''}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 期間（終了） */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">発生日（終了）</Label>
            <Input
              type="date"
              value={filters.to_date || ''}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 検索 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">キーワード検索</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="内容、顧客名..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-8"
              />
            </div>
          </div>

          {/* クリアボタン */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500 invisible">操作</Label>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!hasFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-1" />
              クリア
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
