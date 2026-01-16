/**
 * 利用者編集モーダル
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
import { Loader2, Trash2 } from 'lucide-react'
import { useUserOperations, useUserRoles } from '@/hooks/useUsers'
import { useUserContext } from '@/contexts/UserContext'
import { toast } from 'sonner'
import type { UserProfileResponse, UserRole, UserRoleInfo } from '@/types/user'

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
}

export function UserEditModal({ open, onOpenChange, user, onSuccess }: UserEditModalProps) {
  const { user: currentUser } = useUserContext()
  const { updateUser, deactivateUser, loading } = useUserOperations()
  const { roles, fetchRoles } = useUserRoles()
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    role: 'user',
    isActive: true,
  })
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  const isSelf = currentUser?.id === user?.id

  useEffect(() => {
    if (open && user) {
      fetchRoles()
      setFormData({
        displayName: user.display_name || '',
        role: user.role,
        isActive: user.is_active,
      })
      setShowDeactivateConfirm(false)
    }
  }, [open, user, fetchRoles])

  const handleSubmit = async () => {
    if (!user) return

    try {
      await updateUser(user.id, {
        display_name: formData.displayName || undefined,
        role: formData.role,
        is_active: formData.isActive,
      })
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
      <DialogContent className="sm:max-w-[425px]">
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
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="表示名"
            />
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
