/**
 * 店舗詳細ページのコメント機能
 *
 * - StoreCommentAlert: ページ上部のアラート（未入力時）＋「コメントを追加」ボタン
 * - StoreCommentEditor: 画面右下に固定表示される入力ボックス
 *   （数値を見ながらスクロールしても入力欄が動かない）
 * - StoreCommentList: ページ最下部のコメント一覧（誰でも編集・削除可）
 *
 * 3つのコンポーネントは useStoreComments が返す共有 state で連動する。
 * コメントは店舗×月単位（monthly_comments.segment_id）で保存される。
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useMonthlyComments } from '@/hooks/useComment'
import type { MonthlyComment } from '@/types/comment'
import { cn } from '@/lib/utils'

// =============================================================================
// 共有 state フック
// =============================================================================

export interface StoreCommentsState {
  comments: MonthlyComment[]
  loading: boolean
  saving: boolean
  error: string | null
  /** エディタが開いているか */
  editorOpen: boolean
  /** 編集対象（null なら新規追加） */
  editing: MonthlyComment | null
  openEditor: (target?: MonthlyComment) => void
  closeEditor: () => void
  save: (text: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useStoreComments(month: string, segmentId: string): StoreCommentsState {
  const {
    comments, loading, saving, error,
    addComment, updateComment, removeComment,
  } = useMonthlyComments('store', month, segmentId)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<MonthlyComment | null>(null)

  // 月や店舗が変わったらエディタを閉じる（別対象への誤保存防止）
  useEffect(() => {
    setEditorOpen(false)
    setEditing(null)
  }, [month, segmentId])

  const openEditor = useCallback((target?: MonthlyComment) => {
    setEditing(target ?? null)
    setEditorOpen(true)
  }, [])

  const closeEditor = useCallback(() => {
    setEditorOpen(false)
    setEditing(null)
  }, [])

  const save = useCallback(async (text: string) => {
    if (editing?.id) {
      await updateComment(editing.id, text)
    } else {
      await addComment(text)
    }
    setEditorOpen(false)
    setEditing(null)
  }, [editing, addComment, updateComment])

  const remove = useCallback(async (id: string) => {
    await removeComment(id)
  }, [removeComment])

  return {
    comments, loading, saving, error,
    editorOpen, editing, openEditor, closeEditor, save, remove,
  }
}

// =============================================================================
// 上部: アラート＋コメント追加ボタン
// =============================================================================

export function StoreCommentAlert({
  state,
  monthLabel,
}: {
  state: StoreCommentsState
  monthLabel: string
}) {
  const { comments, loading, editorOpen, openEditor } = state
  const noComment = !loading && comments.length === 0

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border px-4 py-3',
        noComment
          ? 'bg-amber-50 border-amber-300'
          : 'bg-gray-50 border-gray-200',
      )}
    >
      {noComment ? (
        <div className="flex items-center gap-2 flex-1 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {monthLabel}のコメントが未入力です。数値を確認のうえコメントを記入してください。
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 text-gray-600">
          <MessageSquare className="h-4 w-4 shrink-0" />
          <p className="text-sm">
            {monthLabel}のコメント: {loading ? '読込中...' : `${comments.length}件`}
            <span className="text-gray-400 ml-1">（ページ最下部に表示）</span>
          </p>
        </div>
      )}
      <Button
        size="sm"
        onClick={() => openEditor()}
        disabled={editorOpen}
        className={cn('shrink-0', noComment && 'bg-amber-600 hover:bg-amber-700')}
      >
        <MessageSquarePlus className="h-4 w-4 mr-1.5" />
        コメントを追加
      </Button>
    </div>
  )
}

// =============================================================================
// 固定表示の入力ボックス（右下フローティング）
// =============================================================================

export function StoreCommentEditor({
  state,
  monthLabel,
  storeName,
}: {
  state: StoreCommentsState
  monthLabel: string
  storeName: string
}) {
  const { editorOpen, editing, saving, error, closeEditor, save } = state
  const [text, setText] = useState('')

  // エディタが開くたびに編集対象のテキストをセット
  useEffect(() => {
    if (editorOpen) {
      setText(editing?.comment ?? '')
    }
  }, [editorOpen, editing])

  if (!editorOpen) return null

  const handleSave = async () => {
    if (!text.trim()) return
    try {
      await save(text.trim())
    } catch {
      // エラーは state.error に反映される（パネルは開いたまま）
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(440px,calc(100vw-2rem))]">
      <Card className="shadow-2xl border-2 border-green-600/40">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-700" />
            {editing ? 'コメントを編集' : 'コメントを追加'}
            <span className="text-xs font-normal text-gray-500">
              {storeName}・{monthLabel}
            </span>
            <button
              onClick={closeEditor}
              className="ml-auto p-1 rounded hover:bg-gray-100"
              aria-label="閉じる"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="数値を確認しながらコメントを入力できます（この入力欄はスクロールしても固定表示されます）"
            rows={6}
            autoFocus
            className="resize-y text-sm"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeEditor} disabled={saving}>
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !text.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// 最下部: コメント一覧（誰でも編集・削除可）
// =============================================================================

function formatDateTime(value?: string): string {
  if (!value) return ''
  try {
    return format(parseISO(value), 'yyyy/M/d HH:mm', { locale: ja })
  } catch {
    return value
  }
}

export function StoreCommentList({
  state,
  monthLabel,
}: {
  state: StoreCommentsState
  monthLabel: string
}) {
  const { comments, loading, saving, openEditor, remove } = state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // コメントは確認頻度が高いためデフォルト開
  const [open, setOpen] = useState(true)

  const handleDelete = async (id: string) => {
    if (!window.confirm('このコメントを削除しますか？')) return
    try {
      setDeletingId(id)
      await remove(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card id="store-comments">
      <CardHeader
        onClick={() => setOpen(!open)}
        className="cursor-pointer select-none hover:bg-gray-50/60 transition-colors"
      >
        <CardTitle className="flex items-center gap-2 min-h-7">
          {open ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <MessageSquare className="h-5 w-5 text-green-700" />
          コメント（{monthLabel}）
          {!loading && (
            <span className="text-sm font-normal text-gray-400">{comments.length}件</span>
          )}
        </CardTitle>
      </CardHeader>
      {open && (
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-gray-400 text-sm">読み込み中...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            この月のコメントはまだありません。上部の「コメントを追加」から記入できます。
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <p className="text-sm whitespace-pre-wrap break-words">{c.comment}</p>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-400">
                  <span>作成: {c.created_by_email ?? '-'} {formatDateTime(c.created_at)}</span>
                  {c.updated_by_email && (
                    <span>最終編集: {c.updated_by_email} {formatDateTime(c.updated_at)}</span>
                  )}
                  <span className="sm:ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => openEditor(c)}
                      disabled={saving}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      編集
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-600 hover:text-red-700"
                      onClick={() => c.id && handleDelete(c.id)}
                      disabled={saving || deletingId === c.id}
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      削除
                    </Button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      )}
    </Card>
  )
}
