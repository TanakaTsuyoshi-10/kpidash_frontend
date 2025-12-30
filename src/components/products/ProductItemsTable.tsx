/**
 * 個別商品販売実績テーブル
 * 検索、ソート、ページネーション機能付き
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductItemSalesData } from '@/hooks/useStoreDetail'

interface Props {
  items: ProductItemSalesData[]
  displayMonth: string
}

type SortKey = 'product_code' | 'product_name' | 'product_category' | 'quantity' | 'quantity_yoy' | 'sales' | 'sales_yoy'
type SortOrder = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 通貨フォーマット
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return `¥${value.toLocaleString()}`
}

// 前年比フォーマット（変化率: 0基準）
function formatYoY(rate: number | null | undefined): string {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export function ProductItemsTable({ items, displayMonth }: Props) {
  // 検索・フィルタ状態
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // ソート状態
  const [sortKey, setSortKey] = useState<SortKey>('product_code')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // ページネーション状態
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // カテゴリ一覧を取得
  const categories = useMemo(() => {
    const cats = new Set<string>()
    items.forEach(item => {
      if (item.product_category) {
        cats.add(item.product_category)
      }
    })
    return Array.from(cats).sort()
  }, [items])

  // フィルタリング
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 検索テキストフィルタ
      if (searchText) {
        const search = searchText.toLowerCase()
        const matchCode = item.product_code.toLowerCase().includes(search)
        const matchName = item.product_name.toLowerCase().includes(search)
        if (!matchCode && !matchName) return false
      }
      // カテゴリフィルタ
      if (categoryFilter !== 'all' && item.product_category !== categoryFilter) {
        return false
      }
      return true
    })
  }, [items, searchText, categoryFilter])

  // ソート
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems]
    sorted.sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortKey) {
        case 'product_code':
          aVal = a.product_code
          bVal = b.product_code
          break
        case 'product_name':
          aVal = a.product_name
          bVal = b.product_name
          break
        case 'product_category':
          aVal = a.product_category || ''
          bVal = b.product_category || ''
          break
        case 'quantity':
          aVal = a.quantity ?? -Infinity
          bVal = b.quantity ?? -Infinity
          break
        case 'quantity_yoy':
          aVal = a.quantity_yoy ?? -Infinity
          bVal = b.quantity_yoy ?? -Infinity
          break
        case 'sales':
          aVal = a.sales ?? -Infinity
          bVal = b.sales ?? -Infinity
          break
        case 'sales_yoy':
          aVal = a.sales_yoy ?? -Infinity
          bVal = b.sales_yoy ?? -Infinity
          break
      }

      if (aVal === null || bVal === null) return 0
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredItems, sortKey, sortOrder])

  // ページネーション
  const totalPages = Math.ceil(sortedItems.length / pageSize)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, currentPage, pageSize])

  // ソートハンドラ
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // ソートアイコン
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />
  }

  // フィルタ変更時にページをリセット
  const handleSearchChange = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setCurrentPage(1)
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>商品別販売実績 ({displayMonth})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品別販売実績 ({displayMonth})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* フィルタ・検索エリア */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="商品CD・商品名で検索..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="分類で絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての分類</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 結果件数 */}
        <div className="text-sm text-gray-500 mb-2">
          {filteredItems.length}件中 {(currentPage - 1) * pageSize + 1}〜{Math.min(currentPage * pageSize, filteredItems.length)}件を表示
        </div>

        {/* テーブル */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="min-w-[80px] cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('product_code')}
                >
                  <div className="flex items-center">
                    商品CD
                    <SortIcon columnKey="product_code" />
                  </div>
                </TableHead>
                <TableHead
                  className="min-w-[200px] cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('product_name')}
                >
                  <div className="flex items-center">
                    商品名
                    <SortIcon columnKey="product_name" />
                  </div>
                </TableHead>
                <TableHead
                  className="min-w-[100px] cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('product_category')}
                >
                  <div className="flex items-center">
                    分類
                    <SortIcon columnKey="product_category" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end">
                    数量
                    <SortIcon columnKey="quantity" />
                  </div>
                </TableHead>
                <TableHead className="text-right">前年数量</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('quantity_yoy')}
                >
                  <div className="flex items-center justify-end">
                    数量前年比
                    <SortIcon columnKey="quantity_yoy" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('sales')}
                >
                  <div className="flex items-center justify-end">
                    売上
                    <SortIcon columnKey="sales" />
                  </div>
                </TableHead>
                <TableHead className="text-right">前年売上</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('sales_yoy')}
                >
                  <div className="flex items-center justify-end">
                    売上前年比
                    <SortIcon columnKey="sales_yoy" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow key={item.product_code}>
                  <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{item.product_category || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.quantity?.toLocaleString() ?? '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-500">
                    {item.quantity_previous_year?.toLocaleString() ?? '-'}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono text-sm',
                    item.quantity_yoy && item.quantity_yoy >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoY(item.quantity_yoy)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(item.sales)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-500">
                    {formatCurrency(item.sales_previous_year)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono text-sm',
                    item.sales_yoy && item.sales_yoy >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoY(item.sales_yoy)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ページネーション */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">表示件数:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              最初
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            <span className="text-sm text-gray-600 px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              次へ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              最後
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
