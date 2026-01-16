/**
 * クレーム新規登録ダイアログ
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
import { Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import type {
  ComplaintCreate,
  DepartmentType,
  CustomerType,
  ComplaintType,
  ComplaintMasterDataResponse,
} from '@/types/complaint'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ComplaintCreate) => Promise<void>
  saving?: boolean
  error?: string | null
  masterData?: ComplaintMasterDataResponse | null
}

const defaultDepartmentOptions: { value: DepartmentType; label: string }[] = [
  { value: 'store', label: '店舗' },
  { value: 'ecommerce', label: '通販' },
  { value: 'headquarters', label: '本社' },
]

const defaultCustomerOptions: { value: CustomerType; label: string }[] = [
  { value: 'new', label: '新規' },
  { value: 'repeat', label: 'リピート' },
  { value: 'unknown', label: '不明' },
]

const defaultComplaintTypeOptions: { value: ComplaintType; label: string }[] = [
  { value: 'customer_service', label: '接客関連' },
  { value: 'facility', label: '店舗設備' },
  { value: 'operation', label: '操作方法' },
  { value: 'product', label: '味・商品' },
  { value: 'other', label: 'その他' },
]

const initialFormData: ComplaintCreate = {
  incident_date: format(new Date(), 'yyyy-MM-dd'),
  department_type: 'store',
  customer_type: 'unknown',
  complaint_type: 'product',
  complaint_content: '',
}

export function ComplaintCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  saving,
  error,
  masterData,
}: Props) {
  const [formData, setFormData] = useState<ComplaintCreate>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // ダイアログが開いたらフォームをリセット
  useEffect(() => {
    if (open) {
      setFormData({
        ...initialFormData,
        incident_date: format(new Date(), 'yyyy-MM-dd'),
      })
      setValidationErrors({})
    }
  }, [open])

  // マスタデータからオプション生成
  const departmentOptions = masterData?.department_types?.length
    ? masterData.department_types.map(d => ({ value: d.code as DepartmentType, label: d.name }))
    : defaultDepartmentOptions

  const customerOptions = masterData?.customer_types?.length
    ? masterData.customer_types.map(c => ({ value: c.code as CustomerType, label: c.name }))
    : defaultCustomerOptions

  const complaintTypeOptions = masterData?.complaint_types?.length
    ? masterData.complaint_types.map(t => ({ value: t.code as ComplaintType, label: t.name }))
    : defaultComplaintTypeOptions

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.incident_date) {
      errors.incident_date = '発生日を入力してください'
    }
    if (!formData.complaint_content.trim()) {
      errors.complaint_content = 'クレーム内容を入力してください'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await onSubmit({
        ...formData,
        customer_name: formData.customer_name?.trim() || null,
        contact_info: formData.contact_info?.trim() || null,
        responder_name: formData.responder_name?.trim() || null,
      })
    } catch {
      // エラーは親コンポーネントで処理
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setValidationErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>クレーム新規登録</DialogTitle>
            <DialogDescription>
              クレーム情報を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* エラー表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 発生日 */}
            <div className="space-y-1.5">
              <Label htmlFor="incident_date">
                発生日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="incident_date"
                type="date"
                value={formData.incident_date}
                onChange={(e) =>
                  setFormData({ ...formData, incident_date: e.target.value })
                }
                className={validationErrors.incident_date ? 'border-red-500' : ''}
              />
              {validationErrors.incident_date && (
                <p className="text-xs text-red-500">{validationErrors.incident_date}</p>
              )}
            </div>

            {/* 発生部署 */}
            <div className="space-y-1.5">
              <Label htmlFor="department_type">
                発生部署 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.department_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, department_type: value as DepartmentType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="発生部署を選択" />
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
              <Label htmlFor="complaint_type">
                クレーム種類 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.complaint_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, complaint_type: value as ComplaintType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="種類を選択" />
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

            {/* 顧客種類 */}
            <div className="space-y-1.5">
              <Label htmlFor="customer_type">
                顧客種類 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.customer_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, customer_type: value as CustomerType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="顧客種類を選択" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 顧客名 */}
            <div className="space-y-1.5">
              <Label htmlFor="customer_name">顧客名</Label>
              <Input
                id="customer_name"
                type="text"
                value={formData.customer_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                placeholder="顧客名（任意）"
              />
            </div>

            {/* 連絡先 */}
            <div className="space-y-1.5">
              <Label htmlFor="contact_info">連絡先</Label>
              <Input
                id="contact_info"
                type="text"
                value={formData.contact_info || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contact_info: e.target.value })
                }
                placeholder="電話番号やメールアドレス（任意）"
              />
            </div>

            {/* クレーム内容 */}
            <div className="space-y-1.5">
              <Label htmlFor="complaint_content">
                クレーム内容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="complaint_content"
                value={formData.complaint_content}
                onChange={(e) =>
                  setFormData({ ...formData, complaint_content: e.target.value })
                }
                placeholder="クレームの詳細内容"
                rows={4}
                className={validationErrors.complaint_content ? 'border-red-500' : ''}
              />
              {validationErrors.complaint_content && (
                <p className="text-xs text-red-500">{validationErrors.complaint_content}</p>
              )}
            </div>

            {/* 対応者 */}
            <div className="space-y-1.5">
              <Label htmlFor="responder_name">対応者</Label>
              <Input
                id="responder_name"
                type="text"
                value={formData.responder_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, responder_name: e.target.value })
                }
                placeholder="対応者名（任意）"
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
                  登録中...
                </>
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
