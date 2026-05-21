/**
 * ユーザー情報コンテキスト
 * 現在のユーザー情報を管理し、アプリ全体で共有
 * SWRで楽観的レンダリング：isLoading中でも子コンポーネントをレンダリングし、
 * SWRデータフェッチを先行開始させる
 */
'use client'

import { createContext, useContext, ReactNode } from 'react'
import useSWR from 'swr'
import type { CurrentUserResponse, PageKey } from '@/types/user'

interface UserContextType {
  user: CurrentUserResponse | null
  isAdmin: boolean
  isExecutive: boolean
  allowedPages: PageKey[]
  isLoading: boolean
  error: string | null
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: user, error, isLoading, mutate } = useSWR<CurrentUserResponse>(
    '/api/v1/users/me'
  )

  return (
    <UserContext.Provider
      value={{
        user: user ?? null,
        isAdmin: user?.is_admin ?? false,
        isExecutive: user?.role === 'executive',
        allowedPages: user?.allowed_pages ?? [],
        isLoading,
        error: error?.message ?? null,
        refreshUser: async () => { await mutate() },
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
