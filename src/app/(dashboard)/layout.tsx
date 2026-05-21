/**
 * ダッシュボードレイアウト（レスポンシブ対応）
 */
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar, menuItems } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { UserProvider, useUserContext } from '@/contexts/UserContext'
import { SWRProvider } from '@/lib/swr-config'
import { useAuth } from '@/hooks/useAuth'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const { user, allowedPages, isAdmin, isLoading } = useUserContext()
  const pathname = usePathname()
  const router = useRouter()

  // 権限のないページにアクセスした場合、最初の許可ページへリダイレクト
  useEffect(() => {
    if (isLoading || !user) return
    if (isAdmin) return

    // 現在のパスに対応するpageKeyを取得（長いパスから順にマッチさせる）
    const sortedItems = [...menuItems]
      .filter((item) => item.pageKey)
      .sort((a, b) => b.href.length - a.href.length)
    const currentItem = sortedItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    )
    if (!currentItem?.pageKey) return // 設定ページ等、pageKeyなしは常にアクセス可

    if (!allowedPages.includes(currentItem.pageKey)) {
      // 最初の許可ページへリダイレクト
      const firstAllowed = menuItems.find(
        (item) => item.pageKey && allowedPages.includes(item.pageKey)
      )
      if (firstAllowed) {
        router.replace(firstAllowed.href)
      } else {
        // 許可ページがない場合は設定ページへ
        router.replace('/settings')
      }
    }
  }, [isLoading, user, isAdmin, allowedPages, pathname, router])

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
  }

  const userName = user?.display_name || user?.email?.split('@')[0]

  const filteredNavItems = menuItems
    .filter((item) => {
      // pageKeyなし（設定など）は常時表示
      if (!item.pageKey) return true
      return isAdmin || allowedPages.includes(item.pageKey)
    })
    .map((item) => ({
      href: item.href,
      label: item.label,
      icon: <item.icon className="h-5 w-5" />,
    }))

  return (
    <div className="min-h-screen bg-gray-100">
      {/* デスクトップ用サイドバー */}
      <Sidebar userName={userName} onLogout={handleLogout} />

      {/* モバイル用サイドバー */}
      <MobileSidebar
        navItems={filteredNavItems}
        userName={userName}
        onLogout={handleLogout}
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />

      {/* モバイル用ボトムナビ */}
      <BottomNav onMoreClick={() => setMobileSidebarOpen(true)} />

      {/* メインコンテンツ */}
      <div className="lg:pl-64 overflow-x-hidden">
        <Header />
        <main id="main-content" className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
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
    <SWRProvider>
      <UserProvider>
        <DashboardContent>{children}</DashboardContent>
      </UserProvider>
    </SWRProvider>
  )
}
