/**
 * 利用者編集モーダル
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Loader2, Trash2 } from 'lucide-react'
import { useUserOperations, useUserRoles } from '@/hooks/useUsers'
import { useUserContext } from '@/contexts/UserContext'
import { toast } from 'sonner'
import { getOrgDepartments, getUserPermissions, updateUserPermissions } from '@/lib/api/users'
import { PAGE_KEYS, PAGE_LABELS } from '@/types/user'
import type { OrgDepartment, UserProfileResponse, UserRole, UserRoleInfo, PageKey } from '@/types/user'

interface UserEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfileResponse | null
  onSuccess: () => void
}

interface FormData {
  displayName: string
  role: UserRole
  isActive: boolean
  orgDepartmentId: string
  position: string
  canApprove: boolean
  approvalViewAll: boolean
}

export function UserEditModal({ open, onOpenChange, user, onSuccess }: UserEditModalProps) {
  const { user: currentUser } = useUserContext()
  const { updateUser, deactivateUser, loading } = useUserOperations()
  const { roles, fetchRoles } = useUserRoles()
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    role: 'user',
    isActive: true,
    orgDepartmentId: '',
    position: '',
    canApprove: false,
    approvalViewAll: false,
  })
  const [departments, setDepartments] = useState<OrgDepartment[]>([])
  const [selectedPages, setSelectedPages] = useState<PageKey[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  const isSelf = currentUser?.id === user?.id
  // 管理者・役員は全ページ閲覧可（ページ権限の個別選択は一般利用者のみ）
  const isFullAccessRole = formData.role === 'admin' || formData.role === 'executive'

  const fetchPermissions = useCallback(async (userId: string) => {
    setPermissionsLoading(true)
    try {
      const result = await getUserPermissions(userId)
      setSelectedPages(result.allowed_pages)
    } catch {
      setSelectedPages([])
    } finally {
      setPermissionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && user) {
      fetchRoles()
      getOrgDepartments().then((r) => setDepartments(r.departments)).catch(() => setDepartments([]))
      setFormData({
        displayName: user.display_name || '',
        role: user.role,
        isActive: user.is_active,
        orgDepartmentId: user.org_department_id ?? '',
        position: user.position ?? '',
        canApprove: user.can_approve ?? false,
        approvalViewAll: user.approval_view_all ?? false,
      })
      setShowDeactivateConfirm(false)
      // 一般利用者のみページ権限を取得（管理者・役員は全ページ固定）
      if (user.role === 'user') {
        fetchPermissions(user.id)
      } else {
        setSelectedPages([])
      }
    }
  }, [open, user, fetchRoles, fetchPermissions])

  // ロールが一般利用者に変更された場合、ページ権限を取得
  useEffect(() => {
    if (open && user && formData.role === 'user' && user.role !== 'user') {
      fetchPermissions(user.id)
    }
  }, [open, user, formData.role, fetchPermissions])

  const togglePage = (pageKey: PageKey) => {
    setSelectedPages((prev) =>
      prev.includes(pageKey) ? prev.filter((k) => k !== pageKey) : [...prev, pageKey]
    )
  }

  const handleSubmit = async () => {
    if (!user) return

    try {
      await updateUser(user.id, {
        display_name: formData.displayName || undefined,
        role: formData.role,
        is_active: formData.isActive,
        org_department_id: formData.orgDepartmentId,
        position: formData.position,
        can_approve: formData.canApprove,
        approval_view_all: formData.approvalViewAll,
      })
      // 一般利用者かつ本人編集でない場合のみページ権限を更新（管理者・役員は全ページ固定）
      if (!isSelf && formData.role === 'user') {
        await updateUserPermissions(user.id, selectedPages)
      }
      toast.success('利用者情報を更新しました')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  const handleDeactivate = async () => {
    if (!user) return

    try {
      await deactivateUser(user.id)
      toast.success('利用者を無効化しました')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '無効化に失敗しました')
    }
  }

  const getRoleDescription = (role: UserRoleInfo): string => {
    if (role.description) return role.description
    if (role.code === 'admin') return '利用者登録・権限変更が可能'
    return '閲覧・データ入力のみ可能'
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>利用者情報編集</DialogTitle>
          <DialogDescription>
            利用者の情報を編集します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>メールアドレス</Label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-600">
              {user.email}
              <span className="text-xs text-gray-400 ml-2">(変更不可)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">表示名（名前）</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="表示名"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="orgDepartment">部署</Label>
              <select
                id="orgDepartment"
                value={formData.orgDepartmentId}
                onChange={(e) => setFormData({ ...formData, orgDepartmentId: e.target.value })}
                className="w-full h-9 px-3 border rounded-md text-sm bg-white"
              >
                <option value="">（未設定）</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">役職</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="例: 店長、課長"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>権限</Label>
            <div className="space-y-2">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <label
                    key={role.code}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      isSelf ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.code}
                      checked={formData.role === role.code}
                      onChange={() => setFormData({ ...formData, role: role.code as UserRole })}
                      disabled={isSelf}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-500">
                        {getRoleDescription(role)}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <>
                  <label
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      isSelf ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={formData.role === 'user'}
                      onChange={() => setFormData({ ...formData, role: 'user' })}
                      disabled={isSelf}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">一般利用者</div>
                      <div className="text-sm text-gray-500">
                        閲覧・データ入力のみ可能
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      isSelf ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={() => setFormData({ ...formData, role: 'admin' })}
                      disabled={isSelf}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">管理者</div>
                      <div className="text-sm text-gray-500">
                        利用者登録・権限変更が可能
                      </div>
                    </div>
                  </label>
                </>
              )}
            </div>
            {isSelf && (
              <p className="text-xs text-gray-500">
                自分自身の権限は変更できません
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>状態</Label>
            <label
              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                isSelf ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={isSelf}
              />
              <span>有効</span>
            </label>
            {isSelf && (
              <p className="text-xs text-gray-500">
                自分自身を無効化することはできません
              </p>
            )}
          </div>

          {/* 承認ワークフロー権限（ページ閲覧権限とは別軸） */}
          <div className="space-y-2">
            <Label>承認ワークフロー権限</Label>
            <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.canApprove}
                  onChange={(e) => setFormData({ ...formData, canApprove: e.target.checked })}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <span className="font-medium">承認権限</span>
                  <span className="block text-xs text-gray-500">
                    稟議の承認者として指定できるようになります
                  </span>
                </span>
              </label>
              <label
                className={`flex items-start gap-2 ${
                  isFullAccessRole ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isFullAccessRole || formData.approvalViewAll}
                  onChange={(e) => setFormData({ ...formData, approvalViewAll: e.target.checked })}
                  disabled={isFullAccessRole}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <span className="font-medium">稟議の全社閲覧</span>
                  <span className="block text-xs text-gray-500">
                    {isFullAccessRole
                      ? '管理者・役員は常に全社の稟議を閲覧できます'
                      : '自部署以外の稟議も閲覧できるようになります（通常は自部署のみ）'}
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* ページ閲覧権限（本人編集時は非表示。管理者・役員は全ページ固定表示） */}
          {!isSelf && (
            <div className="space-y-2">
              <Label>閲覧許可ページ</Label>
              {isFullAccessRole ? (
                <>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {PAGE_KEYS.map((key) => (
                      <span
                        key={key}
                        className="px-3 py-1.5 rounded-md text-sm font-medium border bg-green-600 text-white border-green-600 opacity-80"
                      >
                        {PAGE_LABELS[key]}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formData.role === 'admin' ? '管理者' : '役員'}は全ページを閲覧できます（変更不可）
                  </p>
                </>
              ) : permissionsLoading ? (
                <div className="flex items-center gap-2 p-3 text-gray-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  読み込み中...
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {PAGE_KEYS.map((key) => {
                      const active = selectedPages.includes(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => togglePage(key)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                            active
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {PAGE_LABELS[key]}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-500">
                    選択されたページのみ閲覧可能になります
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-4 sm:flex-col">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新する'
              )}
            </Button>
          </div>

          {!isSelf && (
            <div className="border-t pt-4 w-full">
              {showDeactivateConfirm ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">本当に無効化しますか？</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeactivateConfirm(false)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeactivate}
                      disabled={loading}
                    >
                      無効化する
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full justify-start"
                  onClick={() => setShowDeactivateConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  このユーザーを無効化する
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
