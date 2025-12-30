/**
 * 商品別販売状況のAPI関数
 */
import { apiClient } from './client'
import type {
  ProductMatrixResponse,
  ProductTrendResponse,
  KPIDefinition,
} from '@/types/product'

/**
 * 商品マトリックスデータを一括取得する
 */
export async function getProductMatrix(
  departmentSlug: string = 'store',
  month?: string,
  periodType: 'monthly' | 'cumulative' = 'monthly'
): Promise<ProductMatrixResponse> {
  const params = new URLSearchParams({
    department_slug: departmentSlug,
    period_type: periodType,
  })
  if (month) params.append('month', month)
  return apiClient.get<ProductMatrixResponse>(`/kpi/product-matrix?${params.toString()}`)
}

// 現在の会計年度を取得（9月起点）
function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  return month >= 9 ? year : year - 1
}

/**
 * 商品別月次推移データを取得する
 */
export async function getProductTrend(
  departmentSlug: string,
  productGroup: string,
  fiscalYear?: number
): Promise<ProductTrendResponse> {
  const targetFiscalYear = fiscalYear ?? getCurrentFiscalYear()
  const params = new URLSearchParams({
    department_slug: departmentSlug,
    product_group: productGroup,
    fiscal_year: targetFiscalYear.toString(),
  })
  return apiClient.get<ProductTrendResponse>(`/kpi/product-trend?${params.toString()}`)
}

/**
 * 商品グループ一覧を取得する
 */
export async function getProductGroups(
  departmentSlug: string = 'store'
): Promise<KPIDefinition[]> {
  const params = new URLSearchParams({
    department_slug: departmentSlug,
    category: '商品グループ',
  })
  return apiClient.get<KPIDefinition[]>(`/kpi/definitions?${params.toString()}`)
}
