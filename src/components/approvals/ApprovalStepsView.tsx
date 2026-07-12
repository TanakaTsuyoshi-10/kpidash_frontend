/**
 * 承認ルート表示（詳細ページ用）
 * 各ステップの承認者・状態を表示し、admin/executive には差替ボタンを出す
 */
'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, MinusCircle, UserCog, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { reassignStep } from '@/lib/api/approvals'
import { useAssignableUsers } from '@/hooks/useApprovals'
import {
  STEP_STATUS_LABELS,
  type ApprovalMode,
  type ApprovalStep,
} from '@/types/approval'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  approved: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
  skipped: <MinusCircle className="h-4 w-4 text-gray-400" />,
  delegated: <UserCog className="h-4 w-4 text-purple-500" />,
}

interface ApprovalStepsViewProps {
  requestId: string
  steps: ApprovalStep[]
  mode: ApprovalMode
  currentStepNo: number
  requestStatus: string
  canReassign: boolean
  onUpdated: () => void
}

export function ApprovalStepsView({
  requestId,
  steps,
  mode,
  currentStepNo,
  requestStatus,
  canReassign,
  onUpdated,
}: ApprovalStepsViewProps) {
  const [reassignTarget, setReassignTarget] = useState<ApprovalStep | null>(null)
  const [newAssignee, setNewAssignee] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const { users } = useAssignableUsers()

  const handleReassign = async () => {
    if (!reassignTarget || !newAssignee) return
    setSaving(true)
    try {
      await reassignStep(requestId, reassignTarget.id, newAssignee, comment || undefined)
      toast.success('承認者を差し替えました')
      setReassignTarget(null)
      setNewAssignee('')
      setComment('')
      onUpdated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '差替に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isCurrent =
          requestStatus === 'pending' &&
          step.status === 'pending' &&
          (mode !== 'sequential' || step.step_no === currentStepNo)
        return (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
              isCurrent ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
            }`}
          >
            {mode === 'sequential' && (
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
                {step.step_no}
              </span>
            )}
            {STATUS_ICONS[step.status]}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800 truncate">
                {step.assignee_name ?? step.assignee_email}
                {step.assignee_id !== step.original_assignee_id && (
                  <span className="text-purple-600 text-xs ml-1.5">（差替済み）</span>
                )}
              </p>
              {step.comment && (
                <p className="text-xs text-gray-500 truncate">{step.comment}</p>
              )}
            </div>
            <span className="flex-shrink-0 text-xs text-gray-500">
              {STEP_STATUS_LABELS[step.status]}
            </span>
            {canReassign && step.status === 'pending' && requestStatus === 'pending' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReassignTarget(step)}
                title="承認者を差し替える（管理者・役員のみ）"
              >
                <ArrowRightLeft className="h-4 w-4 text-gray-400" />
              </Button>
            )}
          </div>
        )
      })}

      {/* 差替ダイアログ */}
      <Dialog
        open={!!reassignTarget}
        onOpenChange={(open) => !open && setReassignTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>承認者の差替</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              現在の承認者:{' '}
              <span className="font-medium">
                {reassignTarget?.assignee_name ?? reassignTarget?.assignee_email}
              </span>
            </p>
            <div>
              <Label className="mb-1.5 block">新しい承認者</Label>
              <Select value={newAssignee || undefined} onValueChange={setNewAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== reassignTarget?.assignee_id)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name}（{u.email}）
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">差替理由（任意）</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="例: 承認者が休暇中のため"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignTarget(null)}>
              キャンセル
            </Button>
            <Button onClick={handleReassign} disabled={!newAssignee || saving}>
              {saving ? '差替中...' : '差し替える'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
