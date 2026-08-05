/**
 * 部署マスタ管理モーダル（管理者用）
 * 部署の追加・名称変更・有効/無効切替を行う。
 * 部署は稟議の閲覧スコープ（自部署のみ閲覧）の判定に使われる。
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Pencil, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  createOrgDepartment,
  getOrgDepartments,
  updateOrgDepartment,
} from '@/lib/api/users'
import type { OrgDepartment } from '@/types/user'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 部署の変更後に呼ばれる（利用者一覧の再読込用） */
  onChanged?: () => void
}

export function OrgDepartmentModal({ open, onOpenChange, onChanged }: Props) {
  const [departments, setDepartments] = useState<OrgDepartment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getOrgDepartments(true)
      setDepartments(res.departments)
    } catch {
      toast.error('部署一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchDepartments()
      setNewName('')
      setEditingId(null)
    }
  }, [open, fetchDepartments])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    try {
      await createOrgDepartment(name, departments.length + 1)
      setNewName('')
      await fetchDepartments()
      onChanged?.()
      toast.success('部署を追加しました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '部署の追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleRename = async (id: string) => {
    const name = editingName.trim()
    if (!name) return
    setSaving(true)
    try {
      await updateOrgDepartment(id, { name })
      setEditingId(null)
      await fetchDepartments()
      onChanged?.()
      toast.success('部署名を変更しました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '変更に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (dept: OrgDepartment) => {
    setSaving(true)
    try {
      await updateOrgDepartment(dept.id, { is_active: !dept.is_active })
      await fetchDepartments()
      onChanged?.()
      toast.success(dept.is_active ? '部署を無効化しました' : '部署を有効化しました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '変更に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>部署管理</DialogTitle>
          <DialogDescription>
            利用者に設定する部署を管理します。稟議は同じ部署のメンバーのみ閲覧できます
            （役員・管理者・全社閲覧権限者を除く）。
          </DialogDescription>
        </DialogHeader>

        {/* 追加 */}
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新しい部署名（例: 店舗運営部）"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
          <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>

        {/* 一覧 */}
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : departments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            部署がまだ登録されていません。上の入力欄から追加してください。
          </p>
        ) : (
          <div className="space-y-1.5">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center gap-2 border rounded-lg px-3 py-2"
              >
                {editingId === dept.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(dept.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => handleRename(dept.id)}
                      disabled={saving}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${dept.is_active ? '' : 'text-gray-400 line-through'}`}>
                      {dept.name}
                    </span>
                    {!dept.is_active && (
                      <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">無効</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => {
                        setEditingId(dept.id)
                        setEditingName(dept.name)
                      }}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 px-2 text-xs ${dept.is_active ? 'text-red-600' : 'text-green-600'}`}
                      onClick={() => handleToggleActive(dept)}
                      disabled={saving}
                    >
                      {dept.is_active ? '無効化' : '有効化'}
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
