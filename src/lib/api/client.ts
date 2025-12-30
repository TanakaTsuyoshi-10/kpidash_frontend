/**
 * バックエンドAPI（FastAPI）との通信クライアント
 * Supabaseのアクセストークンをヘッダーに付与
 */
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Supabaseクライアントをシングルトンとして保持
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

export class ApiClient {
  private async getAuthHeader(): Promise<HeadersInit> {
    const supabase = getSupabase()

    // まずgetSessionを試す
    let { data: { session } } = await supabase.auth.getSession()

    // セッションがない場合、refreshSessionを試す
    if (!session) {
      const { data } = await supabase.auth.refreshSession()
      session = data.session
    }

    if (!session?.access_token) {
      console.error('セッションが取得できません')
      throw new Error('認証が必要です')
    }

    console.log('Token obtained:', session.access_token.substring(0, 20) + '...')

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      // 422などのエラーの場合、詳細を取得
      try {
        const errorBody = await response.json()
        const detail = errorBody.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        } else if (Array.isArray(detail)) {
          // FastAPI validation error format
          const messages = detail.map((e: { loc?: string[]; msg?: string }) =>
            e.msg || JSON.stringify(e)
          ).join(', ')
          throw new Error(messages || `API Error: ${response.status}`)
        }
        throw new Error(JSON.stringify(errorBody) || `API Error: ${response.status}`)
      } catch (e) {
        if (e instanceof Error && e.message !== `API Error: ${response.status}`) {
          throw e
        }
        throw new Error(`API Error: ${response.status}`)
      }
    }

    return response.json()
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      // 422などのエラーの場合、詳細を取得
      try {
        const errorBody = await response.json()
        const detail = errorBody.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        } else if (Array.isArray(detail)) {
          // FastAPI validation error format
          const messages = detail.map((e: { loc?: string[]; msg?: string }) =>
            e.msg || JSON.stringify(e)
          ).join(', ')
          throw new Error(messages || `API Error: ${response.status}`)
        }
        throw new Error(JSON.stringify(errorBody) || `API Error: ${response.status}`)
      } catch (e) {
        if (e instanceof Error && e.message !== `API Error: ${response.status}`) {
          throw e
        }
        throw new Error(`API Error: ${response.status}`)
      }
    }

    return response.json()
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      try {
        const errorBody = await response.json()
        const detail = errorBody.detail
        if (typeof detail === 'string') {
          throw new Error(detail)
        } else if (Array.isArray(detail)) {
          const messages = detail.map((e: { loc?: string[]; msg?: string }) =>
            e.msg || JSON.stringify(e)
          ).join(', ')
          throw new Error(messages || `API Error: ${response.status}`)
        }
        throw new Error(JSON.stringify(errorBody) || `API Error: ${response.status}`)
      } catch (e) {
        if (e instanceof Error && e.message !== `API Error: ${response.status}`) {
          throw e
        }
        throw new Error(`API Error: ${response.status}`)
      }
    }

    return response.json()
  }

  async delete(endpoint: string): Promise<void> {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    // 204 No Content の場合はJSONをパースしない
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
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

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async downloadFile(endpoint: string, filename: string): Promise<void> {
    const supabase = getSupabase()
    let { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const { data } = await supabase.auth.refreshSession()
      session = data.session
    }

    if (!session?.access_token) {
      throw new Error('認証が必要です')
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
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
  }
}

export const apiClient = new ApiClient()
