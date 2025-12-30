/**
 * 月次コメント入力カード
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Save, Loader2, Trash2, Pencil, X } from 'lucide-react'
import { useMonthlyComment } from '@/hooks/useComment'
import type { CommentCategory } from '@/types/comment'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  category: CommentCategory
  period: string
  title?: string
}

export function MonthlyCommentCard({ category, period, title = '月次コメント' }: Props) {
  const { commentData, comment, loading, saving, error, setComment, save, remove } = useMonthlyComment(
    category,
    period
  )
  const [showSuccess, setShowSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 既存コメントがあるかどうか
  const hasExistingComment = commentData != null && commentData.comment.length > 0

  // 編集可能かどうか（コメントがないか、自分が作成者）
  const canEdit = !hasExistingComment || commentData?.is_owner !== false

  const handleSave = async () => {
    try {
      await save()
      setShowSuccess(true)
      setIsEditing(false)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch {
      // エラーはhookで処理
    }
  }

  const handleDelete = async () => {
    try {
      await remove()
      setConfirmDelete(false)
    } catch {
      // エラーはhookで処理
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setComment(commentData?.comment ?? '')
    setIsEditing(false)
  }

  // 更新日時をフォーマット
  const formatUpdatedAt = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      return format(parseISO(dateStr), 'yyyy/MM/dd HH:mm', { locale: ja })
    } catch {
      return dateStr
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
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 編集モードまたは新規作成 */}
          {(isEditing || !hasExistingComment) && canEdit ? (
            <>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="当月の実績に関するコメントや特記事項を入力してください..."
                rows={4}
                className="resize-none"
              />

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {showSuccess && (
                    <span className="text-green-600">保存しました</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing && (
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      キャンセル
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={saving || !comment.trim()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    保存
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* 閲覧モード */
            <>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{commentData?.comment}</p>
              </div>

              {/* 作成者情報 */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    入力者: {commentData?.created_by_email || (commentData?.is_owner ? '自分' : '不明')}
                  </span>
                  {commentData?.updated_at && (
                    <span>
                      更新: {formatUpdatedAt(commentData.updated_at)}
                    </span>
                  )}
                </div>

                {/* 編集・削除ボタン（作成者のみ） */}
                {commentData?.is_owner && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEdit}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      編集
                    </Button>
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
                )}
              </div>

              {/* 他者のコメントの場合 */}
              {commentData?.is_owner === false && (
                <div className="text-xs text-gray-400 italic">
                  ※このコメントは編集できません
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
