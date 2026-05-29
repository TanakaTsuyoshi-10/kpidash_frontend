/**
 * 取締役会 詳細ダイアログ
 *
 * 構成:
 * - 上部: 説明資料（Googleスライド埋め込みビューア）
 * - 中部: 決議・報告トピック
 * - 下部: 議事録全文
 * - 編集・削除ボタン
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SlideEmbed } from './SlideEmbed'
import { TopicBadge } from './TopicBadge'
import { Loader2, AlertCircle, Pencil, Trash2, Presentation, FileText } from 'lucide-react'
import { format } from 'date-fns'
import type { BoardMeeting } from '@/types/board'

interface Props {
  meeting: BoardMeeting | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (meeting: BoardMeeting) => void
  onDelete?: (id: string) => Promise<void>
  saving?: boolean
  error?: string | null
}

export function BoardMeetingDetailDialog({
  meeting,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  saving,
  error,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      setShowDeleteConfirm(false)
    }
  }, [open, meeting])

  if (!meeting) return null

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    try {
      await onDelete(meeting.id)
      handleClose()
    } catch {
      // エラーは親で処理
    }
  }

  const meetingDate = format(new Date(meeting.meeting_date), 'yyyy年M月d日')

  // 削除確認表示
  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>削除確認</DialogTitle>
            <DialogDescription>
              この取締役会の記録を削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="py-2">
            <p className="text-sm font-medium text-gray-700">{meeting.title}</p>
            <p className="text-xs text-gray-500">{meetingDate}</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const decisionTopics = meeting.topics.filter((t) => t.category === '決議')
  const reportTopics = meeting.topics.filter((t) => t.category === '報告')
  const otherTopics = meeting.topics.filter(
    (t) => t.category !== '決議' && t.category !== '報告'
  )
  const orderedTopics = [...decisionTopics, ...reportTopics, ...otherTopics]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting.title}</DialogTitle>
          <DialogDescription>開催日: {meetingDate}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 py-2">
          {/* 説明資料（Googleスライド） */}
          {meeting.materials.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                <Presentation className="h-4 w-4" />
                説明資料（この画面内で閲覧）
              </p>
              {meeting.materials.map((material, index) => (
                <div key={index} className="space-y-1.5">
                  {/* ラベル（ファイル名）の表示は SlideEmbed 側で扱う */}
                  <SlideEmbed url={material.url} label={material.label} />
                </div>
              ))}
            </div>
          )}

          {/* 決議・報告トピック */}
          {orderedTopics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                決議・報告トピック
              </p>
              <ul className="space-y-1.5 text-sm">
                {orderedTopics.map((topic, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <TopicBadge category={topic.category} className="mt-0.5 shrink-0" />
                    <span className="text-gray-700">{topic.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 議事録 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              議事録
            </p>
            {meeting.minutes_text ? (
              <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 max-h-72 overflow-y-auto whitespace-pre-line">
                {meeting.minutes_text}
              </div>
            ) : (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4">
                議事録は登録されていません
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            閉じる
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              削除
            </Button>
          )}
          {onEdit && (
            <Button type="button" onClick={() => onEdit(meeting)}>
              <Pencil className="h-4 w-4 mr-1.5" />
              編集
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
