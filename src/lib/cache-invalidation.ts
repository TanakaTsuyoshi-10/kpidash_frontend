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
 * 全キャッシュを無効化（汎用アップロード用）
 */
export function invalidateAllCache() {
  invalidateKPICache()
  invalidateEcommerceCache()
  invalidateManufacturingCache()
  invalidateOrderForecastCache()
}
