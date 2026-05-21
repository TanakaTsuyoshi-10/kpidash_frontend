/**
 * 取締役会資料・議事録API
 */
import { apiClient } from './client'
import type {
  BoardMeeting,
  BoardMeetingCreate,
  BoardMeetingUpdate,
  BoardMeetingListResponse,
} from '@/types/board'

const BASE_PATH = '/api/v1/board'

/**
 * 取締役会一覧取得
 */
export async function getBoardMeetings(): Promise<BoardMeetingListResponse> {
  return apiClient.get<BoardMeetingListResponse>(`${BASE_PATH}/`)
}

/**
 * 取締役会詳細取得
 */
export async function getBoardMeeting(id: string): Promise<BoardMeeting> {
  return apiClient.get<BoardMeeting>(`${BASE_PATH}/${id}`)
}

/**
 * 取締役会新規作成
 */
export async function createBoardMeeting(
  data: BoardMeetingCreate
): Promise<BoardMeeting> {
  return apiClient.post<BoardMeeting>(`${BASE_PATH}/`, data)
}

/**
 * 取締役会更新
 */
export async function updateBoardMeeting(
  id: string,
  data: BoardMeetingUpdate
): Promise<BoardMeeting> {
  return apiClient.put<BoardMeeting>(`${BASE_PATH}/${id}`, data)
}

/**
 * 取締役会削除
 */
export async function deleteBoardMeeting(id: string): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/${id}`)
}
