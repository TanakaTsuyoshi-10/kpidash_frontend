/**
 * ダッシュボードヘッダー
 */
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useUserContext } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { signOut } = useAuth()
  const { user, isLoading } = useUserContext()

  // 表示名を取得（表示名がない場合はメールの@前を使用）
  const getDisplayName = () => {
    if (!user) return ''
    if (user.display_name) return user.display_name
    return user.email.split('@')[0]
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          MaruokaKPI
        </h1>

        <div className="flex items-center gap-4">
          {!isLoading && user && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{getDisplayName()}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
