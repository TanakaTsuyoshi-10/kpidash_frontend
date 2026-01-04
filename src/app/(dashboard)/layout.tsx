'use client'

import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserProvider } from '@/contexts/UserContext'
import { SWRProvider } from '@/lib/swr-config'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <SWRProvider>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-w-0 p-6 overflow-x-auto">
              {children}
            </main>
          </div>
        </div>
      </SWRProvider>
    </UserProvider>
  )
}
