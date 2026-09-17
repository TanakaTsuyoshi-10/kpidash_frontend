/**
 * 承認ルートエディタ（ステップベース）
 *
 * 承認ルートを「ステップ」の並びとして編集する。
 * - ステップは上から順に進む（順次承認）
 * - 1つのステップに複数の承認者を入れると「同時回覧・全員承認」になり、
 *   全員の承認が揃った時点で次のステップへ進む
 * 例: 自部署は1人ずつのステップを並べて順次承認 → 関係部署を1ステップに
 *     まとめて同時承認 → 最後に最終決裁者のステップ、という構成が組める。
 *
 * データ上は ApproverInput の step_no がステップ番号で、同じ step_no を
 * 持つ承認者が同時承認グループになる（approval_mode は常に sequential）。
 */
'use client'

import { Plus, Trash2, ArrowDown, Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssignableUsers } from '@/hooks/useApprovals'
import { groupUsersByDepartment } from '@/components/approvals/groupUsersByDepartment'
import type { ApprovalMode, ApproverInput } from '@/types/approval'

interface ApprovalRouteEditorProps {
  approvers: ApproverInput[]
  mode: ApprovalMode
  onChange: (approvers: ApproverInput[], mode: ApprovalMode) => void
  disabled?: boolean
}

/** approvers（step_no 付きフラット配列）→ ステップごとの2次元配列 */
function toStages(approvers: ApproverInput[]): string[][] {
  if (approvers.length === 0) return [['']]
  const map = new Map<number, string[]>()
  for (const a of approvers) {
    const list = map.get(a.step_no) ?? []
    list.push(a.assignee_id)
    map.set(a.step_no, list)
  }
  return [...map.entries()].sort((x, y) => x[0] - y[0]).map(([, ids]) => ids)
}

/** ステップ2次元配列 → approvers フラット配列（step_no は 1 始まり連番） */
function toApprovers(stages: string[][]): ApproverInput[] {
  return stages.flatMap((members, i) =>
    members.map((id) => ({ step_no: i + 1, assignee_id: id }))
  )
}

export function ApprovalRouteEditor({
  approvers,
  onChange,
  disabled = false,
}: ApprovalRouteEditorProps) {
  const { users } = useAssignableUsers()
  const departmentGroups = groupUsersByDepartment(users)

  const stages = toStages(approvers)
  // 新しいルートは常に sequential（同時承認は同一ステップ内の複数人で表現する）
  const emit = (next: string[][]) => onChange(toApprovers(next), 'sequential')

  const addStage = () => emit([...stages, ['']])

  const addMember = (stageIdx: number) =>
    emit(stages.map((m, i) => (i === stageIdx ? [...m, ''] : m)))

  const removeMember = (stageIdx: number, memberIdx: number) => {
    const next = stages
      .map((m, i) => (i === stageIdx ? m.filter((_, j) => j !== memberIdx) : m))
      .filter((m) => m.length > 0)
    emit(next.length > 0 ? next : [['']])
  }

  const setMember = (stageIdx: number, memberIdx: number, id: string) =>
    emit(
      stages.map((m, i) =>
        i === stageIdx ? m.map((v, j) => (j === memberIdx ? id : v)) : m
      )
    )

  const selectedIds = new Set(stages.flat().filter(Boolean))

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">承認ルート（ステップ順に承認が進みます）</Label>
        <div className="space-y-1.5">
          {stages.map((members, stageIdx) => (
            <div key={stageIdx}>
              {stageIdx > 0 && (
                <div className="flex justify-center text-gray-300 py-0.5">
                  <ArrowDown className="h-4 w-4" />
                </div>
              )}
              <div className="rounded-md border border-gray-200 bg-gray-50/50 p-2 space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                    {stageIdx + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    ステップ{stageIdx + 1}
                  </span>
                  {members.length > 1 && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      <Users className="h-3 w-3" />
                      同時回覧・全員の承認が必要
                    </span>
                  )}
                </div>
                {members.map((assigneeId, memberIdx) => (
                  <div key={memberIdx} className="flex items-center gap-2">
                    <Select
                      value={assigneeId || undefined}
                      onValueChange={(v) => setMember(stageIdx, memberIdx, v)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="flex-1 bg-white">
                        <SelectValue placeholder="承認者を選択..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentGroups.map(([dept, deptUsers]) => (
                          <SelectGroup key={dept}>
                            <SelectLabel className="text-xs text-gray-400 bg-gray-50">
                              {dept}
                            </SelectLabel>
                            {deptUsers.map((u) => (
                              <SelectItem
                                key={u.id}
                                value={u.id}
                                disabled={selectedIds.has(u.id) && assigneeId !== u.id}
                              >
                                {u.display_name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(stageIdx, memberIdx)}
                      disabled={disabled}
                      title="この承認者を外す"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addMember(stageIdx)}
                  disabled={disabled}
                  className="text-xs text-gray-500 h-7"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  同時承認者を追加
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStage}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            ステップを追加
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          ステップは上から順に進みます。同じステップに複数人を入れると同時に回覧され、
          全員の承認が揃うと次のステップへ進みます。
        </p>
      </div>
    </div>
  )
}
