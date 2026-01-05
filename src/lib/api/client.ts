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

  async get<T>(endpoint: string, timeout?: number): Promise<T> {
    const headers = await this.getAuthHeader()

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        { method: 'GET', headers },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました。')
      }
      throw error
    }
  }

  async post<T>(endpoint: string, data?: unknown, timeout?: number): Promise<T> {
    const headers = await this.getAuthHeader()

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        {
          method: 'POST',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました。')
      }
      throw error
    }
  }

  async put<T>(endpoint: string, data?: unknown, timeout?: number): Promise<T> {
    const headers = await this.getAuthHeader()

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        {
          method: 'PUT',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました。')
      }
      throw error
    }
  }

  async patch<T>(endpoint: string, data?: unknown, timeout?: number): Promise<T> {
    const headers = await this.getAuthHeader()

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        {
          method: 'PATCH',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました。')
      }
      throw error
    }
  }

  async delete(endpoint: string, timeout?: number): Promise<void> {
    const headers = await this.getAuthHeader()

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        { method: 'DELETE', headers },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        this.handleErrorResponse(response.status, errorData)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました。')
      }
      throw error
    }
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
