/**
 * Slack連携API
 */
import { apiClient } from './client'
import type { SlackPostsResponse } from '@/types/slack'

const BASE_PATH = '/api/v1/slack'

/**
 * Slack投稿（本日の新着・昨日）を取得
 */
export async function fetchSlackPosts(): Promise<SlackPostsResponse> {
  return apiClient.get<SlackPostsResponse>(`${BASE_PATH}/posts`)
}
