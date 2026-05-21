/**
 * 餃子ニュースAPI
 */
import { apiClient } from './client'
import type { NewsResponse } from '@/types/news'

const BASE_PATH = '/api/v1/news'

/**
 * 餃子ニュース一覧取得
 */
export async function fetchGyozaNews(limit = 8): Promise<NewsResponse> {
  return apiClient.get<NewsResponse>(`${BASE_PATH}/gyoza?limit=${limit}`)
}
