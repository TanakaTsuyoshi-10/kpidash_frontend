/**
 * ダッシュボードレイアウト（レスポンシブ対応）
 */
'use client'

import { Sidebar, navItems } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { Header } from '@/components/layout/Header'
import { UserProvider, useUserContext } from '@/contexts/UserContext'
import { SWRProvider } from '@/lib/swr-config'
import { useAuth } from '@/hooks/useAuth'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const { user } = useUserContext()

  const handleLogout = async () => {
    await signOut()
  }

  const userName = user?.display_name || user?.email?.split('@')[0]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* デスクトップ用サイドバー */}
      <Sidebar userName={userName} onLogout={handleLogout} />

      {/* モバイル用サイドバー */}
      <MobileSidebar
        navItems={navItems}
        userName={userName}
        onLogout={handleLogout}
      />

      {/* メインコンテンツ */}
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <SWRProvider>
        <DashboardContent>{children}</DashboardContent>
      </SWRProvider>
    </UserProvider>
  )
}
