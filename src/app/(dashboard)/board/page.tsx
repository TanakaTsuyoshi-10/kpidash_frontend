/**
 * 取締役会資料・議事録ページ
 * 役員・管理者のみアクセス可能。
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Briefcase, Plus, Loader2 } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import { useBoardMeetings, useBoardMeeting, useBoardMutation } from '@/hooks/useBoard'
import { BoardMeetingList } from '@/components/board/BoardMeetingList'
import { BoardMeetingDetailDialog } from '@/components/board/BoardMeetingDetailDialog'
import { BoardMeetingFormDialog } from '@/components/board/BoardMeetingFormDialog'
import type {
  BoardMeeting,
  BoardMeetingListItem,
  BoardMeetingCreate,
} from '@/types/board'

export default function BoardPage() {
  const router = useRouter()
  const { isAdmin, allowedPages, isLoading: userLoading } = useUserContext()
  const hasAccess = isAdmin || allowedPages.includes('board')

  // ダイアログ状態
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<BoardMeeting | null>(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // データ取得
  const { data, loading, refetch } = useBoardMeetings(hasAccess)
  const { data: selectedMeeting } = useBoardMeeting(selectedMeetingId)
  const { create, update, remove, saving, error, reset } = useBoardMutation()

  // 権限外はダッシュボードへリダイレクト
  useEffect(() => {
    if (!userLoading && !hasAccess) {
      router.replace('/dashboard')
    }
  }, [userLoading, hasAccess, router])

  // 取締役会選択
  const handleSelect = (meeting: BoardMeetingListItem) => {
    setSelectedMeetingId(meeting.id)
    setDetailDialogOpen(true)
    reset()
  }

  // 新規追加ダイアログを開く
  const openCreateDialog = () => {
    reset()
    setEditingMeeting(null)
    setFormDialogOpen(true)
  }

  // 編集ダイアログを開く
  const handleEdit = (meeting: BoardMeeting) => {
    reset()
    setEditingMeeting(meeting)
    setDetailDialogOpen(false)
    setFormDialogOpen(true)
  }

  // 作成・更新
  const handleSubmit = async (formData: BoardMeetingCreate) => {
    try {
      if (editingMeeting) {
        await update(editingMeeting.id, formData)
        toast.success('取締役会を更新しました')
      } else {
        await create(formData)
        toast.success('取締役会を登録しました')
      }
      setFormDialogOpen(false)
      setEditingMeeting(null)
      refetch()
    } catch {
      toast.error(
        editingMeeting ? '取締役会の更新に失敗しました' : '取締役会の登録に失敗しました'
      )
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    try {
      await remove(id)
      toast.success('取締役会を削除しました')
      setDetailDialogOpen(false)
      setSelectedMeetingId(null)
      refetch()
    } catch {
      toast.error('取締役会の削除に失敗しました')
    }
  }

  // 詳細ダイアログを閉じる
  const closeDetailDialog = (open: boolean) => {
    if (!open) {
      setSelectedMeetingId(null)
    }
    setDetailDialogOpen(open)
  }

  // ローディング中または権限がない場合
  if (userLoading || !hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-slate-600" />
            取締役会資料・議事録
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {data ? `全${data.total}件` : '役員・管理者のみ閲覧可能'}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          新規追加
        </Button>
      </div>

      {/* 一覧 */}
      <BoardMeetingList
        items={data?.meetings ?? []}
        loading={loading}
        onSelect={handleSelect}
      />

      {/* 追加・編集ダイアログ */}
      <BoardMeetingFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open)
          if (!open) setEditingMeeting(null)
        }}
        meeting={editingMeeting}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
      />

      {/* 詳細ダイアログ */}
      <BoardMeetingDetailDialog
        meeting={selectedMeeting}
        open={detailDialogOpen}
        onOpenChange={closeDetailDialog}
        onEdit={handleEdit}
        onDelete={handleDelete}
        saving={saving}
        error={error}
      />
    </div>
  )
}
