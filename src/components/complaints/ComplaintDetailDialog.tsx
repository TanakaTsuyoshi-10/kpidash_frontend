/**
 * クレーム詳細/編集/削除ダイアログ
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
import { ComplaintStatusBadge } from './ComplaintStatusBadge'
import { ComplaintTypeBadge } from './ComplaintTypeBadge'
import { Loader2, AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type {
  ComplaintDetail,
  ComplaintUpdate,
  ComplaintStatus,
} from '@/types/complaint'

interface Props {
  complaint: ComplaintDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, data: ComplaintUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  saving?: boolean
  error?: string | null
}

const statusOptions: { value: ComplaintStatus; label: string }[] = [
  { value: 'in_progress', label: '対応中' },
  { value: 'completed', label: '対応済' },
]

export function ComplaintDetailDialog({
  complaint,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  saving,
  error,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<ComplaintUpdate>({})

  // ダイアログが開いた時に編集データを初期化
  useEffect(() => {
    if (complaint && open) {
      setFormData({
        complaint_content: complaint.complaint_content,
        responder_name: complaint.responder_name,
        status: complaint.status as ComplaintStatus,
        response_summary: complaint.response_summary,
      })
      setIsEditing(false)
      setShowDeleteConfirm(false)
    }
  }, [complaint, open])

  if (!complaint) return null

  const handleClose = () => {
    setIsEditing(false)
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  const handleUpdate = async () => {
    try {
      await onUpdate(complaint.id, formData)
      setIsEditing(false)
    } catch {
      // エラーは親で処理
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(complaint.id)
      handleClose()
    } catch {
      // エラーは親で処理
    }
  }

  const incidentDate = format(new Date(complaint.incident_date), 'yyyy/MM/dd')
  const createdAt = format(new Date(complaint.created_at), 'yyyy/MM/dd HH:mm')
  const updatedAt = format(new Date(complaint.updated_at), 'yyyy/MM/dd HH:mm')

  // 削除確認表示
  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>削除確認</DialogTitle>
            <DialogDescription>
              このクレームを削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="py-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {complaint.complaint_content}
            </p>
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

  // 編集モード
  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>クレーム編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ステータス */}
            <div className="space-y-1.5">
              <Label>対応状況</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ComplaintStatus })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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

            {/* 対応者 */}
            <div className="space-y-1.5">
              <Label>対応者</Label>
              <Input
                value={formData.responder_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, responder_name: e.target.value || null })
                }
                placeholder="対応者名"
              />
            </div>

            {/* クレーム内容 */}
            <div className="space-y-1.5">
              <Label>クレーム内容</Label>
              <Textarea
                value={formData.complaint_content || ''}
                onChange={(e) =>
                  setFormData({ ...formData, complaint_content: e.target.value })
                }
                rows={4}
              />
            </div>

            {/* 対応の概要 */}
            <div className="space-y-1.5">
              <Label>対応の概要</Label>
              <Textarea
                value={formData.response_summary || ''}
                onChange={(e) =>
                  setFormData({ ...formData, response_summary: e.target.value || null })
                }
                rows={3}
                placeholder="対応内容を入力"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              キャンセル
            </Button>
            <Button type="button" onClick={handleUpdate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // 詳細表示モード
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>クレーム詳細</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ステータス・種類 */}
          <div className="flex items-center gap-2">
            <ComplaintStatusBadge status={complaint.status} statusName={complaint.status_name} />
            <ComplaintTypeBadge complaintType={complaint.complaint_type} typeName={complaint.complaint_type_name} />
          </div>

          {/* 基本情報 */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">発生日</Label>
                <p className="text-sm">{incidentDate}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">発生部署</Label>
                <p className="text-sm">
                  {complaint.department_type_name}
                  {complaint.segment_name && <span className="text-gray-500 ml-1">({complaint.segment_name})</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">顧客種類</Label>
                <p className="text-sm">{complaint.customer_type_name}</p>
              </div>
              {complaint.customer_name && (
                <div>
                  <Label className="text-xs text-gray-500">顧客名</Label>
                  <p className="text-sm">{complaint.customer_name}</p>
                </div>
              )}
            </div>

            {complaint.contact_info && (
              <div>
                <Label className="text-xs text-gray-500">連絡先</Label>
                <p className="text-sm">{complaint.contact_info}</p>
              </div>
            )}

            <div>
              <Label className="text-xs text-gray-500">クレーム内容</Label>
              <p className="text-sm whitespace-pre-wrap">{complaint.complaint_content}</p>
            </div>

            {complaint.responder_name && (
              <div>
                <Label className="text-xs text-gray-500">対応者</Label>
                <p className="text-sm">{complaint.responder_name}</p>
              </div>
            )}

            {complaint.response_summary && (
              <div>
                <Label className="text-xs text-gray-500">対応の概要</Label>
                <p className="text-sm whitespace-pre-wrap">{complaint.response_summary}</p>
              </div>
            )}

            {complaint.resolution_cost > 0 && (
              <div>
                <Label className="text-xs text-gray-500">対応費用</Label>
                <p className="text-sm">¥{complaint.resolution_cost.toLocaleString()}</p>
              </div>
            )}

            {complaint.completed_at && (
              <div>
                <Label className="text-xs text-gray-500">完了日時</Label>
                <p className="text-sm">
                  {format(new Date(complaint.completed_at), 'yyyy/MM/dd HH:mm')}
                </p>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span>作成日時: {createdAt}</span>
                </div>
                <div>
                  <span>更新日時: {updatedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            削除
          </Button>
          <Button type="button" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
