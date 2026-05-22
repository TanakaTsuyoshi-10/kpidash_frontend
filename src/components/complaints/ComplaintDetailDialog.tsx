/**
 * クレーム詳細/編集/削除ダイアログ
 *
 * 2セクション構成:
 * - クレーム情報セクション（読み取り専用、編集ボタンで編集モードへ）
 * - 対応セクション（直接編集可能）
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
import { Loader2, AlertCircle, AlertTriangle, Pencil, Trash2, Save } from 'lucide-react'
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
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // クレーム情報の編集用（編集ボタンで切替）
  const [infoFormData, setInfoFormData] = useState<ComplaintUpdate>({})
  // 対応セクションの編集用（常時編集可能）
  const [responseFormData, setResponseFormData] = useState<ComplaintUpdate>({})

  // ダイアログが開いた時にデータを初期化
  useEffect(() => {
    if (complaint && open) {
      setInfoFormData({
        complaint_content: complaint.complaint_content,
      })
      setResponseFormData({
        status: complaint.status as ComplaintStatus,
        responder_name: complaint.responder_name,
        handling_notes: complaint.handling_notes,
        response_summary: complaint.response_summary,
      })
      setIsEditingInfo(false)
      setShowDeleteConfirm(false)
    }
  }, [complaint, open])

  if (!complaint) return null

  const handleClose = () => {
    setIsEditingInfo(false)
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  // クレーム情報の保存
  const handleInfoUpdate = async () => {
    try {
      await onUpdate(complaint.id, infoFormData)
      setIsEditingInfo(false)
    } catch {
      // エラーは親で処理
    }
  }

  // 対応セクションの保存（保存成功時は入力画面を閉じる）
  const handleResponseSave = async () => {
    try {
      await onUpdate(complaint.id, responseFormData)
      handleClose()
    } catch {
      // エラー時は画面を閉じず、親で表示したエラーを確認できるようにする
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

  // 対応結果が未入力かどうか
  const isResponseMissing = !responseFormData.response_summary?.trim()

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

  // メインの詳細表示（2セクション構成）
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>クレーム詳細</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-2">
          {/* ========================================= */}
          {/* セクション1: クレーム情報（読み取り専用） */}
          {/* ========================================= */}
          <div className="border rounded-lg p-4 space-y-3">
            {/* ステータス・種類バッジ */}
            <div className="flex items-center gap-2">
              <ComplaintStatusBadge status={complaint.status} statusName={complaint.status_name} />
              <ComplaintTypeBadge complaintType={complaint.complaint_type} typeName={complaint.complaint_type_name} />
            </div>

            {isEditingInfo ? (
              /* クレーム情報 編集モード */
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">クレーム内容</Label>
                  <Textarea
                    value={infoFormData.complaint_content || ''}
                    onChange={(e) =>
                      setInfoFormData({ ...infoFormData, complaint_content: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInfoFormData({ complaint_content: complaint.complaint_content })
                      setIsEditingInfo(false)
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button type="button" size="sm" onClick={handleInfoUpdate} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>
            ) : (
              /* クレーム情報 読み取り専用モード */
              <>
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
                      {complaint.store_name && <span className="text-gray-500 ml-1">({complaint.store_name})</span>}
                    </p>
                  </div>
                </div>

                {/* 伝票番号（通販の場合） */}
                {complaint.slip_number && (
                  <div>
                    <Label className="text-xs text-gray-500">伝票番号</Label>
                    <p className="text-sm">{complaint.slip_number}</p>
                  </div>
                )}

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

                {/* 編集・削除ボタン */}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingInfo(true)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    編集
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    削除
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ========================================= */}
          {/* セクション2: 対応セクション（直接編集可能） */}
          {/* ========================================= */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">対応セクション</h3>

            {/* 対応状況 */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">対応状況</Label>
              <Select
                value={responseFormData.status}
                onValueChange={(value) =>
                  setResponseFormData({ ...responseFormData, status: value as ComplaintStatus })
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
              <Label className="text-xs text-gray-500">対応者</Label>
              <Input
                value={responseFormData.responder_name || ''}
                onChange={(e) =>
                  setResponseFormData({ ...responseFormData, responder_name: e.target.value || null })
                }
                placeholder="対応者名"
              />
            </div>

            {/* 対応中メモ */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">対応中メモ</Label>
              <Textarea
                value={responseFormData.handling_notes || ''}
                onChange={(e) =>
                  setResponseFormData({ ...responseFormData, handling_notes: e.target.value || null })
                }
                rows={2}
                placeholder="対応中の状況を記録"
              />
            </div>

            {/* 対応結果 */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">対応結果</Label>
              <Textarea
                value={responseFormData.response_summary || ''}
                onChange={(e) =>
                  setResponseFormData({ ...responseFormData, response_summary: e.target.value || null })
                }
                rows={3}
                placeholder="対応結果を入力"
              />
            </div>

            {/* 対応結果未入力警告 */}
            {isResponseMissing && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">対応結果が未入力です</span>
              </div>
            )}

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <Button type="button" onClick={handleResponseSave} disabled={saving}>
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
            </div>
          </div>

          {/* メタデータ */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 px-1">
            <div>
              <span>作成日時: {createdAt}</span>
            </div>
            <div>
              <span>更新日時: {updatedAt}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
