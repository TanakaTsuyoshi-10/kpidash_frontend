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
