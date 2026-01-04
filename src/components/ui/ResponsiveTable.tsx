/**
 * レスポンシブテーブルコンポーネント
 * モバイルではカード表示、デスクトップではテーブル表示
 */
'use client'

import { ReactNode } from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  emptyMessage?: string
  mobileCardRender?: (item: T) => ReactNode
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = 'データがありません',
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  // モバイル用カード表示
  const renderMobileCards = () => (
    <div className="lg:hidden space-y-4">
      {data.map((item) => (
        <div key={String(item[keyField])} className="bg-white rounded-lg shadow p-4">
          {mobileCardRender ? (
            mobileCardRender(item)
          ) : (
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={String(col.key)} className="flex justify-between">
                  <span className="text-gray-500 text-sm">{col.header}</span>
                  <span className="font-medium">
                    {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '-')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // デスクトップ用テーブル表示
  const renderDesktopTable = () => (
    <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={String(item[keyField])} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${col.className || ''}`}
                  >
                    {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <>
      {renderMobileCards()}
      {renderDesktopTable()}
    </>
  )
}
