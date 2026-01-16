export interface Department {
  id: string
  name: string
  slug: string
}

export interface Segment {
  id: string
  department_id: string
  code: string
  name: string
}

export interface KPIMetric {
  name: string
  unit: string
  actual: number | null
  target: number | null
  ytd_actual: number | null
  ytd_target: number | null
  achievement_rate: number | null
  yoy_rate: number | null
  alert_level: 'none' | 'warning' | 'critical'
}

export interface DepartmentSummary {
  department_id: string
  department_name: string
  period: string
  fiscal_year: number
  kpis: KPIMetric[]
}

export interface SegmentDetail {
  segment_id: string
  segment_name: string
  segment_code: string
  period: string
  kpis: KPIMetric[]
  calculated_metrics: {
    customer_unit_price: number | null
    items_per_customer: number | null
  }
}

export interface AlertItem {
  department_name: string
  segment_name: string | null
  kpi_name: string
  achievement_rate: number
  alert_level: 'warning' | 'critical'
  ytd_actual: number
  ytd_target: number
}
