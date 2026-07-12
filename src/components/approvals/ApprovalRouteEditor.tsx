/**
 * 承認ルートエディタ
 * 承認者の複数指定＋承認モード切替
 */
'use client'

import { Plus, Trash2, ArrowDown, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssignableUsers } from '@/hooks/useApprovals'
import {
  APPROVAL_MODE_LABELS,
  type ApprovalMode,
  type ApproverInput,
} from '@/types/approval'

interface ApprovalRouteEditorProps {
  approvers: ApproverInput[]
  mode: ApprovalMode
  onChange: (approvers: ApproverInput[], mode: ApprovalMode) => void
  disabled?: boolean
}

export function ApprovalRouteEditor({
  approvers,
  mode,
  onChange,
  disabled = false,
}: ApprovalRouteEditorProps) {
  const { users } = useAssignableUsers()

  const addApprover = () => {
    const nextStepNo =
      mode === 'sequential'
        ? (approvers.length > 0 ? Math.max(...approvers.map((a) => a.step_no)) + 1 : 1)
        : 1
    onChange([...approvers, { step_no: nextStepNo, assignee_id: '' }], mode)
  }

  const removeApprover = (index: number) => {
    const next = approvers.filter((_, i) => i !== index)
    // sequential は step_no を振り直す
    const renumbered =
      mode === 'sequential'
        ? next.map((a, i) => ({ ...a, step_no: i + 1 }))
        : next
    onChange(renumbered, mode)
  }

  const setAssignee = (index: number, assigneeId: string) => {
    const next = approvers.map((a, i) =>
      i === index ? { ...a, assignee_id: assigneeId } : a
    )
    onChange(next, mode)
  }

  const setMode = (newMode: ApprovalMode) => {
    const renumbered =
      newMode === 'sequential'
        ? approvers.map((a, i) => ({ ...a, step_no: i + 1 }))
        : approvers.map((a) => ({ ...a, step_no: 1 }))
    onChange(renumbered, newMode)
  }

  const selectedIds = new Set(approvers.map((a) => a.assignee_id).filter(Boolean))

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">承認方式</Label>
        <Select
          value={mode}
          onValueChange={(v) => setMode(v as ApprovalMode)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(APPROVAL_MODE_LABELS) as ApprovalMode[]).map((m) => (
              <SelectItem key={m} value={m}>
                {APPROVAL_MODE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block">
          承認者{mode === 'sequential' ? '（上から順に承認）' : '（同時に回覧）'}
        </Label>
        <div className="space-y-2">
          {approvers.map((approver, index) => (
            <div key={index} className="flex items-center gap-2">
              {mode === 'sequential' ? (
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
              ) : (
                <Users className="flex-shrink-0 h-4 w-4 text-gray-400 ml-1.5 mr-1.5" />
              )}
              <Select
                value={approver.assignee_id || undefined}
                onValueChange={(v) => setAssignee(index, v)}
                disabled={disabled}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="承認者を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                      disabled={
                        selectedIds.has(u.id) && approver.assignee_id !== u.id
                      }
                    >
                      {u.display_name}（{u.email}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeApprover(index)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          ))}

          {mode === 'sequential' && approvers.length > 1 && (
            <div className="flex justify-center text-gray-300">
              <ArrowDown className="h-4 w-4" />
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addApprover}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            承認者を追加
          </Button>
        </div>
      </div>
    </div>
  )
}
