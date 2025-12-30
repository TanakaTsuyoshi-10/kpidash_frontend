/**
 * ユーザー情報コンテキスト
 * 現在のユーザー情報を管理し、アプリ全体で共有
 */
'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { apiClient } from '@/lib/api/client'
import type { CurrentUserResponse } from '@/types/user'

interface UserContextType {
  user: CurrentUserResponse | null
  isAdmin: boolean
  isLoading: boolean
  error: string | null
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.get<CurrentUserResponse>('/api/v1/users/me')
      setUser(response)
    } catch (err) {
      console.error('ユーザー情報の取得に失敗:', err)
      setUser(null)
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <UserContext.Provider
      value={{
        user,
        isAdmin: user?.is_admin ?? false,
        isLoading,
        error,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}
