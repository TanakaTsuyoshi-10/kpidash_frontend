/**
 * 人事（HR）関連の型定義
 * SmartHR連携による部署別 人件費・時間外労働。
 * バックエンドスキーマ（backend/app/schemas/hr.py）に準拠。
 */

/** 部署別 人件費（単位: 百万円/月） */
export interface DepartmentLaborCost {
  department: string
  current: number
  previous_year: number
  yoy_rate: number
}

/** 部署別 時間外労働（単位: 時間/月、1人あたり平均） */
export interface DepartmentOvertime {
  department: string
  current: number
  previous_year: number
  yoy_rate: number
}

/** 部署別 人件費の月次推移ポイント */
export interface LaborCostTrendPoint {
  month: string
  /** 部署名 → 人件費（百万円）のマップ */
  values: Record<string, number>
}

/** 部署別 人件費・時間外サマリーレスポンス */
export interface LaborSummaryResponse {
  labor_costs: DepartmentLaborCost[]
  overtime: DepartmentOvertime[]
  labor_cost_trend: LaborCostTrendPoint[]
  /** 人件費の全部署合計（その他含む）。未提供時は null */
  labor_cost_total?: DepartmentLaborCost | null
  /** 時間外労働の全社合計（1人あたり平均）。未提供時は null */
  overtime_total?: DepartmentOvertime | null
  /** サンプルデータかどうか（true=サンプル、false=SmartHR実データ） */
  is_sample: boolean
}

// =============================================================================
// 人事分析（人員構成・推移・入退社・組織指標・店舗別人件費）
// =============================================================================

export interface HeadcountRow {
  name: string
  area?: string | null
  total: number
  fulltime: number
  contract: number
  parttime: number
  unset: number
}

export interface HeadcountSummaryResponse {
  as_of: string | null
  stores: HeadcountRow[]
  others: HeadcountRow[]
  company: HeadcountRow | null
  is_sample: boolean
}

export interface HeadcountTrendResponse {
  months: string[]
  by_group: Record<string, number[]>
  by_department: Record<string, number[]>
  is_sample: boolean
}

export interface TurnoverMonthPoint {
  month: string
  hires: number
  leavers: number
}

export interface TurnoverResponse {
  monthly: TurnoverMonthPoint[]
  hires_total: number
  leavers_total: number
  avg_headcount: number | null
  turnover_rate: number | null
  reasons: { reason: string; count: number }[]
  is_sample: boolean
}

export interface OrgHealthResponse {
  avg_age: number | null
  avg_tenure_years: number | null
  age_distribution: { label: string; count: number }[]
  by_department: {
    department: string
    headcount: number
    avg_age: number | null
    avg_tenure_years: number | null
  }[]
  is_sample: boolean
}

export interface StoreLaborRow {
  store: string
  area?: string | null
  headcount: number
  labor_cost: number
  labor_cost_prev_year: number
  labor_cost_yoy: number | null
  sales: number | null
  labor_cost_ratio: number | null
  sales_per_head: number | null
  overtime_per_head: number | null
}

export interface StoreLaborResponse {
  month: string
  rows: StoreLaborRow[]
  total: StoreLaborRow | null
  unmatched_stores: string[]
  is_sample: boolean
}
