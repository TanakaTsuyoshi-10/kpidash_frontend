/**
 * クレーム管理ページ
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ComplaintFilters } from '@/components/complaints/ComplaintFilters'
import { ComplaintList, type ViewMode } from '@/components/complaints/ComplaintList'
import { ComplaintCreateDialog } from '@/components/complaints/ComplaintCreateDialog'
import { ComplaintDetailDialog } from '@/components/complaints/ComplaintDetailDialog'
import { useComplaints, useComplaint, useComplaintMutation, useComplaintMaster } from '@/hooks/useComplaint'
import { Plus, LayoutGrid, List } from 'lucide-react'
import type { ComplaintFilterParams, ComplaintListItem, ComplaintCreate } from '@/types/complaint'

export default function ComplaintsPage() {
  // フィルター状態
  const [filters, setFilters] = useState<ComplaintFilterParams>({})

  // 表示モード
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // モーダル状態
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // データ取得
  const { data: masterData } = useComplaintMaster()
  const { data, loading, refetch } = useComplaints(filters)
  const { data: selectedComplaint } = useComplaint(selectedComplaintId)
  const { create, update, remove, saving, error, reset } = useComplaintMutation()

  // クレーム選択
  const handleSelect = (complaint: ComplaintListItem) => {
    setSelectedComplaintId(complaint.id)
    setDetailDialogOpen(true)
    reset()
  }

  // 新規作成
  const handleCreate = async (formData: ComplaintCreate) => {
    await create(formData)
    setCreateDialogOpen(false)
    refetch()
  }

  // 更新
  const handleUpdate = async (id: string, formData: Parameters<typeof update>[1]) => {
    await update(id, formData)
    refetch()
  }

  // 削除
  const handleDelete = async (id: string) => {
    await remove(id)
    setDetailDialogOpen(false)
    setSelectedComplaintId(null)
    refetch()
  }

  // 新規作成ダイアログを開く
  const openCreateDialog = () => {
    reset()
    setCreateDialogOpen(true)
  }

  // 詳細ダイアログを閉じる
  const closeDetailDialog = (open: boolean) => {
    if (!open) {
      setSelectedComplaintId(null)
    }
    setDetailDialogOpen(open)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">クレーム管理</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              全{data.total_count}件
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 表示切替 */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* 新規登録ボタン */}
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新規登録
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <ComplaintFilters filters={filters} onChange={setFilters} masterData={masterData} />

      {/* 一覧 */}
      <ComplaintList
        items={data?.complaints ?? []}
        loading={loading}
        viewMode={viewMode}
        onSelect={handleSelect}
      />

      {/* 新規登録ダイアログ */}
      <ComplaintCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        saving={saving}
        error={error}
        masterData={masterData}
      />

      {/* 詳細ダイアログ */}
      <ComplaintDetailDialog
        complaint={selectedComplaint}
        open={detailDialogOpen}
        onOpenChange={closeDetailDialog}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        saving={saving}
        error={error}
      />
    </div>
  )
}
