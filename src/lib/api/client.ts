/**
 * バックエンドAPI（FastAPI）との通信クライアント
 * Supabaseのアクセストークンをヘッダーに付与
 */
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const REQUEST_TIMEOUT = 30000  // 30秒

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

// タイムアウト付きfetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

export class ApiClient {
  private async getAuthHeader(): Promise<HeadersInit> {
    const supabase = getSupabase()
    let { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const { data } = await supabase.auth.refreshSession()
      session = data.session
    }

    if (!session?.access_token) {
      throw new Error('認証が必要です')
    }

    // セキュリティ: トークンをログに出力しない
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  private handleErrorResponse(status: number, errorData?: { detail?: string | Array<{ msg?: string }> }): never {
    // 401: 認証エラー（リダイレクトせずエラーをスロー）
    if (status === 401) {
      throw new Error('認証が必要です。再度ログインしてください。')
    }

    // 429: レート制限
    if (status === 429) {
      throw new Error('リクエスト数が制限を超えました。しばらく待ってから再試行してください。')
    }

    // その他のエラー
    if (errorData?.detail) {
      if (typeof errorData.detail === 'string') {
        throw new Error(errorData.detail)
      } else if (Array.isArray(errorData.detail)) {
        const messages = errorData.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
        throw new Error(messages || `API Error: ${status}`)
      }
    }
    throw new Error(`API Error: ${status}`)
  }

  /**
   * 401時にトークンリフレッシュして1回リトライするリクエストラッパー
   */
  private async requestWithRetry<T>(
    url: string,
    options: RequestInit,
    timeout?: number,
    timeoutMessage: string = 'リクエストがタイムアウトしました。'
  ): Promise<Response> {
    const headers = await this.getAuthHeader()
    const mergedOptions = { ...options, headers: { ...headers, ...options.headers } }

    try {
      const response = await fetchWithTimeout(url, mergedOptions, timeout)

      // 401の場合、トークンリフレッシュして1回リトライ
      if (response.status === 401) {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.refreshSession()
        if (!session?.access_token) {
          this.handleErrorResponse(401)
        }
        const retryHeaders = {
          ...mergedOptions.headers,
          'Authorization': `Bearer ${session.access_token}`,
        }
        const retryResponse = await fetchWithTimeout(
          url, { ...mergedOptions, headers: retryHeaders }, timeout
        )
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}))
          this.handleErrorResponse(retryResponse.status, errorData)
        }
        return retryResponse
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(timeoutMessage)
      }
      throw error
    }
  }

  async get<T>(endpoint: string, timeout?: number): Promise<T> {
    const response = await this.requestWithRetry<T>(
      `${API_URL}${endpoint}`,
      { method: 'GET' },
      timeout
    )
    return response.json()
  }

  async post<T>(endpoint: string, data?: unknown, timeout?: number): Promise<T> {
    const response = await this.requestWithRetry<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      timeout
    )
    return response.json()
  }

  async put<T>(endpoint: string, data?: unknown, timeout?: number): Promise<T> {
    const response = await this.requestWithRetry<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      timeout
    )
    return response.json()
  }

  async patch<T>(endpoint: string, data?: unknown, timeout?: number): Promise<T> {
    const response = await this.requestWithRetry<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      timeout
    )
    return response.json()
  }

  async delete(endpoint: string, timeout?: number): Promise<void> {
    await this.requestWithRetry(
      `${API_URL}${endpoint}`,
      { method: 'DELETE' },
      timeout
    )
  }

  async uploadFile<T>(endpoint: string, file: File, timeout: number = 60000): Promise<T> {
    const supabase = getSupabase()
    let { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const { data } = await supabase.auth.refreshSession()
      session = data.session
    }

    if (!session?.access_token) {
      throw new Error('認証が必要です')
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          body: formData,
        },
        timeout
      )

      // 401の場合、トークンリフレッシュして1回リトライ
      if (response.status === 401) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        if (!refreshed?.access_token) {
          this.handleErrorResponse(401)
        }
        const retryResponse = await fetchWithTimeout(
          `${API_URL}${endpoint}`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${refreshed.access_token}` },
            body: formData,
          },
          timeout
        )
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}))
          this.handleErrorResponse(retryResponse.status, errorData)
        }
        return retryResponse.json()
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('アップロードがタイムアウトしました。')
      }
      throw error
    }
  }

  async downloadFile(endpoint: string, filename: string, timeout: number = 60000): Promise<void> {
    const supabase = getSupabase()
    let { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const { data } = await supabase.auth.refreshSession()
      session = data.session
    }

    if (!session?.access_token) {
      throw new Error('認証が必要です')
    }

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('ダウンロードがタイムアウトしました。')
      }
      throw error
    }
  }
}

export const apiClient = new ApiClient()
