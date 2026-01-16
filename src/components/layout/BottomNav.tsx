/**
 * モバイル用ボトムナビゲーション
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Factory, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  {
    href: '/dashboard',
    label: 'ホーム',
    icon: LayoutDashboard,
  },
  {
    href: '/finance',
    label: '財務',
    icon: TrendingUp,
  },
  {
    href: '/manufacturing',
    label: '製造',
    icon: Factory,
  },
  {
    href: '/upload',
    label: 'アップロード',
    icon: Upload,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t safe-area-inset z-40">
      <div className="flex justify-around">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
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
      </div>
    </nav>
  )
}
