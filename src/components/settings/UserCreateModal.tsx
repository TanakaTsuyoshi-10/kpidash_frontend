/**
 * 新規利用者登録モーダル
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
import { Loader2 } from 'lucide-react'
import { useUserOperations, useUserRoles } from '@/hooks/useUsers'
import { toast } from 'sonner'
import type { UserRole, UserRoleInfo } from '@/types/user'

interface UserCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface FormData {
  email: string
  password: string
  displayName: string
  role: UserRole
}

interface FormErrors {
  email?: string
  password?: string
}

const initialFormData: FormData = {
  email: '',
  password: '',
  displayName: '',
  role: 'user',
}

export function UserCreateModal({ open, onOpenChange, onSuccess }: UserCreateModalProps) {
  const { createUser, loading } = useUserOperations()
  const { roles, fetchRoles } = useUserRoles()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      fetchRoles()
      setFormData(initialFormData)
      setErrors({})
    }
  }, [open, fetchRoles])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    // メールアドレス
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です'
    } else if (!emailPattern.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    // パスワード
    if (!formData.password) {
      newErrors.password = 'パスワードは必須です'
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      await createUser({
        email: formData.email,
        password: formData.password,
        display_name: formData.displayName || undefined,
        role: formData.role,
      })
      toast.success('利用者を登録しました')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '登録に失敗しました')
    }
  }

  const getRoleDescription = (role: UserRoleInfo): string => {
    if (role.description) return role.description
    if (role.code === 'admin') return '利用者登録・権限変更が可能'
    return '閲覧・データ入力のみ可能'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新規利用者登録</DialogTitle>
          <DialogDescription>
            新しい利用者を登録します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              メールアドレス <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              パスワード <span className="text-red-500">*</span>
              <span className="text-gray-500 text-xs ml-2">(8文字以上)</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="表示名（任意）"
            />
          </div>

          <div className="space-y-2">
            <Label>
              権限 <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <label
                    key={role.code}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.code}
                      checked={formData.role === role.code}
                      onChange={() => setFormData({ ...formData, role: role.code as UserRole })}
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
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={formData.role === 'user'}
                      onChange={() => setFormData({ ...formData, role: 'user' })}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">一般利用者</div>
                      <div className="text-sm text-gray-500">
                        閲覧・データ入力のみ可能
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={() => setFormData({ ...formData, role: 'admin' })}
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                登録中...
              </>
            ) : (
              '登録する'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
