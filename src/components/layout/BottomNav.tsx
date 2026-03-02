/**
 * モバイル用ボトムナビゲーション
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, ShoppingCart, Factory, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserContext } from '@/contexts/UserContext'
import type { PageKey } from '@/types/user'

interface BottomNavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  pageKey?: PageKey
}

const bottomNavItems: BottomNavItem[] = [
  { href: '/dashboard', label: 'ホーム', icon: LayoutDashboard, pageKey: 'dashboard' },
  { href: '/finance', label: '財務', icon: TrendingUp, pageKey: 'finance' },
  { href: '/ecommerce', label: '通販', icon: ShoppingCart, pageKey: 'ecommerce' },
  { href: '/manufacturing', label: '製造', icon: Factory, pageKey: 'manufacturing' },
]

interface BottomNavProps {
  onMoreClick?: () => void
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname()
  const { allowedPages, isAdmin } = useUserContext()

  const visibleItems = bottomNavItems.filter(
    (item) => !item.pageKey || isAdmin || allowedPages.includes(item.pageKey)
  )

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t safe-area-inset z-40">
      <div className="flex justify-around">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              className={cn(
                'flex flex-col items-center py-2 px-3 min-w-[64px]',
                isActive ? 'text-green-600' : 'text-gray-500'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={onMoreClick}
          aria-label="その他のメニュー"
          className="flex flex-col items-center py-2 px-3 min-w-[64px] text-gray-500"
        >
          <MoreHorizontal className="w-6 h-6" />
          <span className="text-xs mt-1">その他</span>
        </button>
      </div>
    </nav>
  )
}
