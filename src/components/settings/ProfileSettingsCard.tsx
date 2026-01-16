/**
 * プロファイル設定カード
 * 現在のユーザーの表示名を編集
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Loader2, Check } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import { useUserOperations } from '@/hooks/useUsers'
import { toast } from 'sonner'

export function ProfileSettingsCard() {
  const { user, isLoading: userLoading, refreshUser } = useUserContext()
  const { updateMyProfile, loading: saving } = useUserOperations()
  const [displayName, setDisplayName] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

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
  )
}
