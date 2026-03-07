/**
 * 店舗詳細データ取得フック（SWR版）
 */
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { apiClient } from '@/lib/api/client'

// 商品グループ別販売データ
export interface ProductSalesData {
  product_group: string
  sales: number | null
  sales_previous_year: number | null
  sales_yoy: number | null
  customers: number | null
  customers_previous_year: number | null
  customers_yoy: number | null
  unit_price: number | null  // 客単価 = 売上 / 客数
  unit_price_previous_year: number | null
  unit_price_yoy: number | null
}

// 個別商品販売データ
export interface ProductItemSalesData {
  product_code: string
  product_name: string
  product_category: string  // 商品大分類名
  quantity: number | null  // 件数
  quantity_previous_year: number | null
  quantity_yoy: number | null
  sales: number | null  // 税込小計
  sales_previous_year: number | null
  sales_yoy: number | null
}

// 店舗詳細レスポンス
export interface StoreDetailResponse {
  segment_id: string
  segment_code: string
  segment_name: string
  month: string
  total_sales: number | null
  total_sales_previous_year: number | null
  total_sales_yoy: number | null
  total_customers: number | null
  total_customers_previous_year: number | null
  total_customers_yoy: number | null
  avg_unit_price: number | null  // 全体客単価
  avg_unit_price_previous_year: number | null
  avg_unit_price_yoy: number | null
  products: ProductSalesData[]  // 商品グループ別
  product_items: ProductItemSalesData[]  // 個別商品別
}

export function useStoreDetail(segmentId: string, initialMonth: string) {
  const [month, setMonth] = useState(initialMonth)

  const key = segmentId ? `/kpi/store/${segmentId}/detail?month=${month}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<StoreDetailResponse>(
    key,
    () => {
      const params = new URLSearchParams({ month })
      return apiClient.get<StoreDetailResponse>(
        `/kpi/store/${segmentId}/detail?${params.toString()}`
      )
    },
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, month, setMonth, refetch: mutate }
}
