/**
 * 取締役会 追加/編集ダイアログ
 *
 * 入力項目:
 * - 開催日
 * - タイトル
 * - 資料URL（複数: label + url）
 * - トピック（複数: category + title）
 * - 議事録テキスト
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type {
  BoardMeeting,
  BoardMeetingCreate,
  BoardMaterial,
  BoardTopic,
} from '@/types/board'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 編集対象。null の場合は新規作成 */
  meeting?: BoardMeeting | null
  onSubmit: (data: BoardMeetingCreate) => Promise<void>
  saving?: boolean
  error?: string | null
}

const topicCategoryOptions = ['決議', '報告'] as const

function emptyForm(): BoardMeetingCreate {
  return {
    meeting_date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    materials: [],
    topics: [],
    minutes_text: '',
  }
}

export function BoardMeetingFormDialog({
  open,
  onOpenChange,
  meeting,
  onSubmit,
  saving,
  error,
}: Props) {
  const isEdit = !!meeting
  const [formData, setFormData] = useState<BoardMeetingCreate>(emptyForm())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // ダイアログが開いたらフォームを初期化
  useEffect(() => {
    if (open) {
      if (meeting) {
        setFormData({
          meeting_date: meeting.meeting_date,
          title: meeting.title,
          materials: meeting.materials.map((m) => ({ ...m })),
          topics: meeting.topics.map((t) => ({ ...t })),
          minutes_text: meeting.minutes_text ?? '',
        })
      } else {
        setFormData(emptyForm())
      }
      setValidationErrors({})
    }
  }, [open, meeting])

  // 資料操作
  const addMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { label: '', url: '' }],
    }))
  }

  const updateMaterial = (index: number, patch: Partial<BoardMaterial>) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }))
  }

  const removeMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }))
  }

  // トピック操作
  const addTopic = () => {
    setFormData((prev) => ({
      ...prev,
      topics: [...prev.topics, { category: '決議', title: '' }],
    }))
  }

  const updateTopic = (index: number, patch: Partial<BoardTopic>) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }))
  }

  const removeTopic = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }))
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.meeting_date) {
      errors.meeting_date = '開催日を入力してください'
    }
    if (!formData.title.trim()) {
      errors.title = 'タイトルを入力してください'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await onSubmit({
        meeting_date: formData.meeting_date,
        title: formData.title.trim(),
        // 空の資料・トピックは除外
        materials: formData.materials
          .filter((m) => m.url.trim())
          .map((m) => ({ label: m.label.trim(), url: m.url.trim() })),
        topics: formData.topics
          .filter((t) => t.title.trim())
          .map((t) => ({ category: t.category, title: t.title.trim() })),
        minutes_text: formData.minutes_text?.trim() || null,
      })
    } catch {
      // エラーは親コンポーネントで処理
    }
  }

  const handleClose = () => {
    setFormData(emptyForm())
    setValidationErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? '取締役会の編集' : '取締役会の新規追加'}</DialogTitle>
            <DialogDescription>
              開催日・タイトル・資料・トピック・議事録を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* エラー表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 開催日 */}
            <div className="space-y-1.5">
              <Label htmlFor="meeting_date">
                開催日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) =>
                  setFormData({ ...formData, meeting_date: e.target.value })
                }
                className={validationErrors.meeting_date ? 'border-red-500' : ''}
              />
              {validationErrors.meeting_date && (
                <p className="text-xs text-red-500">{validationErrors.meeting_date}</p>
              )}
            </div>

            {/* タイトル */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                タイトル <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例: 第12回 取締役会"
                className={validationErrors.title ? 'border-red-500' : ''}
              />
              {validationErrors.title && (
                <p className="text-xs text-red-500">{validationErrors.title}</p>
              )}
            </div>

            {/* 資料URL（複数） */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>資料（Googleスライド等のURL）</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  資料を追加
                </Button>
              </div>
              {formData.materials.length === 0 && (
                <p className="text-xs text-gray-400">資料は登録されていません</p>
              )}
              {formData.materials.map((material, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-2 rounded-lg border p-3"
                >
                  <Input
                    type="text"
                    value={material.label}
                    onChange={(e) => updateMaterial(index, { label: e.target.value })}
                    placeholder="資料名（任意）"
                    className="sm:w-1/3"
                  />
                  <Input
                    type="url"
                    value={material.url}
                    onChange={(e) => updateMaterial(index, { url: e.target.value })}
                    placeholder="https://docs.google.com/presentation/d/..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMaterial(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    aria-label="資料を削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* トピック（複数） */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>決議・報告トピック</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTopic}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  トピックを追加
                </Button>
              </div>
              {formData.topics.length === 0 && (
                <p className="text-xs text-gray-400">トピックは登録されていません</p>
              )}
              {formData.topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-2 rounded-lg border p-3"
                >
                  <Select
                    value={topic.category}
                    onValueChange={(value) => updateTopic(index, { category: value })}
                  >
                    <SelectTrigger className="sm:w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {topicCategoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    value={topic.title}
                    onChange={(e) => updateTopic(index, { title: e.target.value })}
                    placeholder="トピックの内容"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTopic(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    aria-label="トピックを削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 議事録 */}
            <div className="space-y-1.5">
              <Label htmlFor="minutes_text">議事録</Label>
              <Textarea
                id="minutes_text"
                value={formData.minutes_text || ''}
                onChange={(e) =>
                  setFormData({ ...formData, minutes_text: e.target.value })
                }
                placeholder="議事録の本文を入力してください"
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? '更新中...' : '登録中...'}
                </>
              ) : isEdit ? (
                '更新'
              ) : (
                '登録'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
