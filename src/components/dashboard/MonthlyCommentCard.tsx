/**
 * 月次コメントカード（複数コメント・編集履歴・全ユーザー編集可能）
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { MessageSquare, Save, Loader2, Trash2, Pencil, X, Plus, History } from 'lucide-react'
import { useMonthlyComments } from '@/hooks/useComment'
import type { CommentCategory, MonthlyComment, CommentEditHistoryEntry } from '@/types/comment'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  category: CommentCategory
  period: string
  title?: string
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'M/d HH:mm', { locale: ja })
  } catch {
    return dateStr
  }
}

/**
 * 個別コメント表示コンポーネント
 */
function CommentItem({
  comment,
  saving,
  onUpdate,
  onDelete,
  onFetchHistory,
}: {
  comment: MonthlyComment
  saving: boolean
  onUpdate: (id: string, text: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onFetchHistory: (id: string) => Promise<CommentEditHistoryEntry[]>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [history, setHistory] = useState<CommentEditHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const isEdited = comment.updated_by != null

  const handleEdit = () => {
    setEditText(comment.comment)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText('')
  }

  const handleSave = async () => {
    if (!comment.id || !editText.trim()) return
    try {
      await onUpdate(comment.id, editText)
      setIsEditing(false)
    } catch {
      // エラーはhookで処理
    }
  }

  const handleDelete = async () => {
    if (!comment.id) return
    try {
      await onDelete(comment.id)
      setConfirmDelete(false)
    } catch {
      // エラーはhookで処理
    }
  }

  const handleFetchHistory = async () => {
    if (!comment.id) return
    setLoadingHistory(true)
    const entries = await onFetchHistory(comment.id)
    setHistory(entries)
    setLoadingHistory(false)
  }

  if (isEditing) {
    return (
      <div className="border rounded-lg p-3 space-y-2">
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end gap-2">
          <Button onClick={handleCancelEdit} variant="outline" size="sm">
            <X className="h-3.5 w-3.5 mr-1" />
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !editText.trim()}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            保存
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{comment.created_by_email || '不明'}</span>
          <span>{formatDateTime(comment.created_at)}</span>
          {isEdited && (
            <span className="text-orange-600">(編集済み)</span>
          )}
        </div>
        <div className="flex gap-1">
          {/* 履歴ボタン */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                onClick={handleFetchHistory}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-gray-600 hover:text-gray-900"
              >
                <History className="h-3.5 w-3.5 mr-1" />
                履歴
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-60 overflow-y-auto" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">編集履歴</h4>
                {loadingHistory ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    読み込み中...
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-500">編集履歴はありません</p>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="border-t pt-2 space-y-1">
                      <div className="text-xs text-gray-500">
                        {entry.edited_by_email || '不明'} ({formatDateTime(entry.edited_at)})
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {entry.previous_comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* 編集ボタン */}
          <Button
            onClick={handleEdit}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-gray-600 hover:text-gray-900"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            編集
          </Button>

          {/* 削除ボタン */}
          {confirmDelete ? (
            <div className="flex gap-1">
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                className="h-7 px-2"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  '削除する'
                )}
              </Button>
              <Button
                onClick={() => setConfirmDelete(false)}
                variant="ghost"
                size="sm"
                className="h-7 px-2"
              >
                キャンセル
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setConfirmDelete(true)}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              削除
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 月次コメントカード
 */
export function MonthlyCommentCard({ category, period, title = '月次コメント' }: Props) {
  const {
    comments,
    loading,
    saving,
    error,
    addComment,
    updateComment,
    removeComment,
    fetchHistory,
  } = useMonthlyComments(category, period)

  const [newComment, setNewComment] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAdd = async () => {
    if (!newComment.trim()) return
    try {
      await addComment(newComment)
      setNewComment('')
      setShowInput(false)
    } catch {
      // エラーはhookで処理
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-400">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            {title}
            {comments.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({comments.length}件)
              </span>
            )}
          </CardTitle>
          {!showInput && (
            <Button
              onClick={() => setShowInput(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* コメント一覧 */}
          {comments.length === 0 && !showInput && (
            <p className="text-sm text-gray-400 text-center py-2">
              コメントはまだありません
            </p>
          )}

          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              saving={saving}
              onUpdate={updateComment}
              onDelete={removeComment}
              onFetchHistory={fetchHistory}
            />
          ))}

          {/* 新規コメント入力 */}
          {showInput && (
            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力してください..."
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setShowInput(false)
                    setNewComment('')
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  キャンセル
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={saving || !newComment.trim()}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1" />
                  )}
                  投稿
                </Button>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
