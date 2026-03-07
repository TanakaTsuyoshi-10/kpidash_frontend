/**
 * SWRキャッシュ無効化ユーティリティ
 * アップロード後に関連データを再取得するために使用
 */
import { mutate } from 'swr'

/**
 * KPI/ダッシュボード関連キャッシュを無効化
 */
export function invalidateKPICache() {
  mutate(
    (key: unknown) =>
      typeof key === 'string' &&
      (key.startsWith('/api/v1/dashboard') || key.startsWith('/api/v1/finance')),
    undefined,
    { revalidate: true }
  )
}

/**
 * 通販関連キャッシュを無効化
 */
export function invalidateEcommerceCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/ecommerce/'),
    undefined,
    { revalidate: true }
  )
}

/**
 * 製造関連キャッシュを無効化
 */
export function invalidateManufacturingCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/api/v1/manufacturing'),
    undefined,
    { revalidate: true }
  )
}

/**
 * 予想注文関連キャッシュを無効化
 */
export function invalidateOrderForecastCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/order-forecast'),
    undefined,
    { revalidate: true }
  )
}

/**
 * KPIフック関連キャッシュを無効化
 */
export function invalidateKPICacheAll() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/kpi/'),
    undefined,
    { revalidate: true }
  )
}

/**
 * 商品関連キャッシュを無効化
 */
export function invalidateProductCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/products/'),
    undefined,
    { revalidate: true }
  )
}

/**
 * 日次販売関連キャッシュを無効化
 */
export function invalidateDailySalesCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/daily-sales/'),
    undefined,
    { revalidate: true }
  )
}

/**
 * クレーム関連キャッシュを無効化
 */
export function invalidateComplaintCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/complaints/'),
    undefined,
    { revalidate: true }
  )
}

/**
 * 目標関連キャッシュを無効化
 */
export function invalidateTargetCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/targets/'),
    undefined,
    { revalidate: true }
  )
}

/**
 * 地区別関連キャッシュを無効化
 */
export function invalidateRegionalCache() {
  mutate(
    (key: unknown) => typeof key === 'string' && key.startsWith('/regional/'),
    undefined,
    { revalidate: true }
  )
}

/**
 * 全キャッシュを無効化（汎用アップロード用）
 */
export function invalidateAllCache() {
  invalidateKPICache()
  invalidateEcommerceCache()
  invalidateManufacturingCache()
  invalidateOrderForecastCache()
  invalidateKPICacheAll()
  invalidateProductCache()
  invalidateDailySalesCache()
  invalidateComplaintCache()
  invalidateTargetCache()
  invalidateRegionalCache()
}
