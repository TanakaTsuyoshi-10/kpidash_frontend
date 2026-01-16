/**
 * アップロード関連のAPI関数
 */
import { createClient } from '@/lib/supabase/client'
import type {
  FileType,
  UploadResult,
  UploadHistoryResponse,
  KPIValuesResponse,
  TargetFormData,
  TargetValuesResponse,
} from '@/types/upload'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Supabaseクライアントをシングルトンとして保持
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

async function getAuthToken(): Promise<string> {
  const supabase = getSupabase()
  let { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const { data } = await supabase.auth.refreshSession()
    session = data.session
  }

  if (!session?.access_token) {
    throw new Error('認証が必要です')
  }

  return session.access_token
}

/**
 * 店舗別CSVをアップロードする
 */
export async function uploadStoreCSV(file: File): Promise<UploadResult> {
  const token = await getAuthToken()

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/upload/store-kpi`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`アップロードエラー: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * 商品別CSVをアップロードする
 */
export async function uploadProductCSV(file: File, segmentId?: string): Promise<UploadResult> {
  const token = await getAuthToken()

  const formData = new FormData()
  formData.append('file', file)
  if (segmentId) {
    formData.append('segment_id', segmentId)
  }

  const response = await fetch(`${API_URL}/upload/product-kpi`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`アップロードエラー: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * 店舗別収支をアップロードする
 */
export async function uploadStorePL(file: File): Promise<UploadResult> {
  const token = await getAuthToken()

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/upload/store-pl`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`アップロードエラー: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * 財務データをアップロードする
 */
export async function uploadFinancial(file: File): Promise<UploadResult> {
  const token = await getAuthToken()

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/upload/financial`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`アップロードエラー: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * 製造データをアップロードする
 */
export async function uploadManufacturing(file: File): Promise<UploadResult> {
  const token = await getAuthToken()

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/upload/manufacturing`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`アップロードエラー: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * CSVをアップロードする（共通関数）
 */
export async function uploadCSV(
  file: File,
  fileType: FileType,
  segmentId?: string
): Promise<UploadResult> {
  switch (fileType) {
    case 'store':
      return uploadStoreCSV(file)
    case 'product':
      return uploadProductCSV(file, segmentId)
    case 'store_pl':
      return uploadStorePL(file)
    case 'financial':
      return uploadFinancial(file)
    case 'manufacturing':
      return uploadManufacturing(file)
    default:
      throw new Error(`不明なファイル種別: ${fileType}`)
  }
}

/**
 * アップロード履歴を取得する
 */
export async function getUploadHistory(): Promise<UploadHistoryResponse> {
  const token = await getAuthToken()

  const response = await fetch(`${API_URL}/upload/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * CSVテンプレートのダウンロードURLを取得する
 */
export function getTemplateDownloadUrl(fileType: FileType): string {
  return `${API_URL}/upload/template/${fileType}`
}

/**
 * KPI値（目標値）一覧を取得する
 */
export async function getTargetValues(params: {
  segmentId?: string
  kpiId?: string
  startDate?: string
  endDate?: string
}): Promise<KPIValuesResponse> {
  const token = await getAuthToken()

  const queryParams = new URLSearchParams()
  queryParams.append('is_target', 'true')
  if (params.segmentId) queryParams.append('segment_id', params.segmentId)
  if (params.kpiId) queryParams.append('kpi_id', params.kpiId)
  if (params.startDate) queryParams.append('start_date', params.startDate)
  if (params.endDate) queryParams.append('end_date', params.endDate)

  const response = await fetch(`${API_URL}/kpi/values?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * 目標値を登録/更新する
 */
export async function upsertTarget(data: TargetFormData): Promise<void> {
  const token = await getAuthToken()

  const response = await fetch(`${API_URL}/kpi/targets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`目標値の保存に失敗しました: ${errorText}`)
  }
}

/**
 * 目標値一覧を取得する
 */
export async function getTargets(
  fiscalYear: number,
  departmentId?: string,
  kpiName?: string
): Promise<TargetValuesResponse> {
  const token = await getAuthToken()

  const queryParams = new URLSearchParams()
  queryParams.append('fiscal_year', fiscalYear.toString())
  if (departmentId) queryParams.append('department_id', departmentId)
  if (kpiName) queryParams.append('kpi_name', kpiName)

  const response = await fetch(`${API_URL}/kpi/targets?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * 目標値を削除する
 */
export async function deleteTarget(id: string): Promise<void> {
  const token = await getAuthToken()

  const response = await fetch(`${API_URL}/kpi/targets/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`目標値の削除に失敗しました: ${errorText}`)
  }
}
