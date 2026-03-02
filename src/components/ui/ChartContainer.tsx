/**
 * レスポンシブ対応のチャートコンテナ
 */
'use client'

import { ReactNode, useRef, useEffect, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'

interface ChartContainerProps {
  title: string
  children: ReactNode
  minHeight?: number
  className?: string
  hasData?: boolean
  emptyMessage?: string
}

export function ChartContainer({
  title,
  children,
  minHeight = 250,
  className = '',
  hasData = true,
  emptyMessage = 'データがありません',
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: minHeight })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        // モバイルでは高さを小さくする
        const height = width < 640 ? Math.max(200, minHeight - 50) : minHeight
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [minHeight])

  return (
    <div className={`bg-card rounded-lg shadow p-3 sm:p-4 lg:p-6 ${className}`}>
      <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">
        {title}
      </h3>
      <div
        ref={containerRef}
        style={{ height: dimensions.height }}
        className="w-full"
      >
        {!hasData ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState title={emptyMessage} description="" />
          </div>
        ) : (
          dimensions.width > 0 && children
        )}
      </div>
    </div>
  )
}
