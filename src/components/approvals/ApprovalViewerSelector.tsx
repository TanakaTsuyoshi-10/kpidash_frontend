/**
 * 閲覧者選択（起票フォーム用）
 *
 * 承認はしないが内容を確認してほしいユーザーを複数選択する。
 * 閲覧者は申請の閲覧と「確認（押印）」ができる。承認権限は不要。
 */
'use client'

import { useMemo, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useViewerCandidates } from '@/hooks/useApprovals'
import { groupUsersByDepartment } from '@/components/approvals/groupUsersByDepartment'

interface Props {
  value: string[]
  onChange: (viewerIds: string[]) => void
}

export function ApprovalViewerSelector({ value, onChange }: Props) {
  const { users } = useViewerCandidates()
  const [selectKey, setSelectKey] = useState(0)

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  const available = users.filter((u) => !value.includes(u.id))

  const addViewer = (id: string) => {
    if (!id || value.includes(id)) return
    onChange([...value, id])
    setSelectKey((k) => k + 1) // Select をリセット
  }

  const removeViewer = (id: string) => {
    onChange(value.filter((v) => v !== id))
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const u = userMap.get(id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-sm text-blue-800"
              >
                <Eye className="h-3.5 w-3.5" />
                {u?.display_name ?? u?.email ?? id}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-blue-100"
                  onClick={() => removeViewer(id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            )
          })}
        </div>
      )}

      <Select key={selectKey} value="" onValueChange={addViewer}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="閲覧者を追加..." />
        </SelectTrigger>
        <SelectContent>
          {available.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">追加できるユーザーがいません</div>
          ) : (
            groupUsersByDepartment(available).map(([dept, deptUsers]) => (
              <SelectGroup key={dept}>
                <SelectLabel className="text-xs text-gray-400 bg-gray-50">{dept}</SelectLabel>
                {deptUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.display_name || u.email}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          )}
        </SelectContent>
      </Select>

      <p className="text-xs text-gray-400">
        閲覧者は承認は行いませんが、申請内容の閲覧と「確認（押印）」ができます。
        確認状況は詳細ページに表示されます。
      </p>
    </div>
  )
}
