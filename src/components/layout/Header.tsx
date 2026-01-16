/**
 * レスポンシブ対応ダッシュボードヘッダー
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* モバイル用スペーサー（ハンバーガーボタン分） */}
          <div className="w-10 lg:hidden" />

          {/* タイトル */}
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            MaruokaKPI
          </h1>

          {/* ユーザー情報とログアウト */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!isLoading && user && (
              <>
                {/* デスクトップ: ユーザー名表示 */}
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{getDisplayName()}</span>
                </div>
                {/* デスクトップ: ログアウトボタン */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="hidden sm:flex"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </Button>
                {/* モバイル: アイコンのみ */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="sm:hidden p-2"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
