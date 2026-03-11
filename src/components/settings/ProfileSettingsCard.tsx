/**
 * プロファイル設定カード
 * 現在のユーザーの表示名を編集 + パスワード変更
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Loader2, Check, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import { useUserOperations } from '@/hooks/useUsers'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function ProfileSettingsCard() {
  const { user, isLoading: userLoading, refreshUser } = useUserContext()
  const { updateMyProfile, loading: saving } = useUserOperations()
  const [displayName, setDisplayName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // パスワード変更用state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // ユーザー情報が取得できたら表示名をセット
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
    }
  }, [user])

  // 変更があるかチェック
  useEffect(() => {
    if (user) {
      setHasChanges(displayName !== (user.display_name || ''))
    }
  }, [displayName, user])

  const handleSave = async () => {
    try {
      await updateMyProfile(displayName)
      await refreshUser()
      toast.success('プロファイルを更新しました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('パスワードは8文字以上で入力してください')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません')
      return
    }

    try {
      setChangingPassword(true)
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        throw error
      }
      toast.success('パスワードを変更しました')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'パスワードの変更に失敗しました')
    } finally {
      setChangingPassword(false)
    }
  }

  const canChangePassword = newPassword.length >= 8 && newPassword === confirmPassword

  if (userLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* プロファイル設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">プロファイル設定</CardTitle>
          </div>
          <CardDescription>
            ヘッダーに表示される名前を設定できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">表示名</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* パスワード変更 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">パスワード変更</CardTitle>
          </div>
          <CardDescription>
            ログインパスワードを変更できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8文字以上で入力"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-600">8文字以上で入力してください</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600">パスワードが一致しません</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !canChangePassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  変更中...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  パスワードを変更
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
